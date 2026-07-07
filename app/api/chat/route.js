import { NextResponse } from "next/server";
import { queryPinecone } from "@/lib/pinecone";
import { getEmbedding } from "@/lib/embeddings";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import {
  processMedicalQuery,
  extractMedicalEntities,
  buildPatientContext,
  formatPipelineDataForAI,
  extractVideoURLs,
  isPipelineAvailable,
} from "@/lib/medical-pipeline";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PINECONE_INDEX = "medical-chatbot";
const PINECONE_TOP_K = 3;

async function fetchDrugsFromFDA(conditionName) {
  try {
    const sanitized = conditionName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const url = `https://api.fda.gov/drug/label.json?search=indications_and_usage:"${encodeURIComponent(sanitized)}"&limit=3`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json();
    return data.results || null;
  } catch {
    return null;
  }
}

function getBrandName(drug) {
  return (
    drug.openfda?.brand_name?.[0] ||
    drug.brand_name?.[0] ||
    drug.openfda?.substance_name?.[0] ||
    drug.openfda?.generic_name?.[0] ||
    "No Brand Listed"
  );
}

function getGenericName(drug) {
  return (
    drug.openfda?.generic_name?.[0] ||
    drug.openfda?.substance_name?.[0] ||
    "Generic Not Listed"
  );
}

function extractFDAKeyFields(drugs) {
  return drugs
    .map((drug, index) => {
      const brandName = getBrandName(drug);
      const genericName = getGenericName(drug);
      const fields = [`Drug ${index + 1}: ${brandName} (${genericName})`];

      if (drug.indications_and_usage?.[0])
        fields.push(
          `Indications: ${drug.indications_and_usage[0].replace(/\s+/g, " ").trim().slice(0, 600)}`,
        );
      if (drug.dosage_and_administration?.[0])
        fields.push(
          `Dosage: ${drug.dosage_and_administration[0].replace(/\s+/g, " ").trim().slice(0, 500)}`,
        );
      if (drug.contraindications?.[0])
        fields.push(
          `Contraindications: ${drug.contraindications[0].replace(/\s+/g, " ").trim().slice(0, 400)}`,
        );
      const warningText = drug.warnings?.[0] || drug.warnings_and_cautions?.[0];
      if (warningText)
        fields.push(
          `Warnings: ${warningText.replace(/\s+/g, " ").trim().slice(0, 400)}`,
        );
      if (drug.drug_interactions?.[0])
        fields.push(
          `Drug Interactions: ${drug.drug_interactions[0].replace(/\s+/g, " ").trim().slice(0, 400)}`,
        );
      if (drug.clinical_pharmacology?.[0])
        fields.push(
          `Clinical Pharmacology: ${drug.clinical_pharmacology[0].replace(/\s+/g, " ").trim().slice(0, 400)}`,
        );

      return fields.join("\n");
    })
    .join("\n\n");
}

async function structureDrugPrescriptionWithAI(
  drugs,
  diagnosedDisease,
  patientAge,
) {
  try {
    const rawDrugData = extractFDAKeyFields(drugs);
    const isMinor =
      patientAge !== null &&
      patientAge !== undefined &&
      Number(patientAge) < 18;

    const prescriptionPrompt = `You are a Medical Information Assistant. The Patient has just been Diagnosed with ${diagnosedDisease}.

    Below is Raw FDA Drug Labeling Data for Approved Medications Indicated for this Condition. Present this as a Clear, Friendly, Patient-Readable Medication Recommendation. For Each Drug Cover: the Drug Name, What it is used for, How to take it, Important Warnings, Contraindications, Drug Interactions, and How it works (Clinical Pharmacology).
    ${isMinor ? "\nIMPORTANT: This Patient is Under 18 Years of Age. Add a Clear, Prominent Notice at the Very Top Recommending Consultation with a Licensed Pediatric Doctor or Healthcare Professional before Administering any Medication." : ""}
    Do NOT use Markdown Formatting such as Asterisks, Bullet Dashes, or Hash Headers. Use Plain Text with Clean Line Breaks only. Separate each Drug Entry Visibly. End the Entire Section with a Brief Note that these are FDA-Approved Label Suggestions and a Healthcare Professional Should Always be Consulted Before Starting any Medication.

    Raw FDA Drug Labeling Data:
    ${rawDrugData}

    Write the Structured Medication Recommendation Below:`;

    const prescriptionResult = await model.generateContent(prescriptionPrompt);
    const structured = prescriptionResult.response.text().trim();
    return `\nRecommended Medications (Source: FDA Drug Labeling Database)\n${structured}`;
  } catch {
    return null;
  }
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
    this.MIN_INTERVAL = 3000;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.MIN_INTERVAL) {
        const waitTime = this.MIN_INTERVAL - timeSinceLastRequest;
        await new Promise((r) => setTimeout(r, waitTime));
      }

      this.lastRequestTime = Date.now();
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.process(), 100);
      }
    }
  }
}

const requestQueue = new RequestQueue();

async function retryWithBackoff(fn, maxRetries = 2, initialDelay = 5000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error.status === 429) {
        if (
          error.message &&
          error.message.includes("exceeded your current quota")
        ) {
          console.error("API Quota Exceeded");
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const retryMatch = error.message.match(/retry in ([\d.]+)s/);
          const retryDelay = retryMatch
            ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000
            : initialDelay * Math.pow(2, attempt);

          console.log(
            `Rate Limit Hit. Retrying in ${retryDelay}ms... (Attempt ${
              attempt + 1
            }/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, chatId, messageHistory } = await req.json();
    const formattedHistory = messageHistory
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    if (!message) {
      return NextResponse.json(
        { error: "Missing `Message` in Body" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User Not Found" }, { status: 404 });
    }

    const userDetails = {
      name: user.name || "",
      accident: user.accident || "",
      address: user.address || "",
      age: user.age || null,
      allergies: user.allergies || "",
      bp_dia: user.bp_dia || null,
      bp_sys: user.bp_sys || null,
      food_habit: user.food_habit || "",
      gender: user.gender || "",
      medical_history: user.medical_history || "",
      sugar_fasting: user.sugar_fasting || null,
      sugar_pp: user.sugar_pp || null,
      surgery: user.surgery || "",
      transfusion: user.transfusion || "",
      // Extended health profile
      weight: user.weight || null,
      height: user.height || null,
      bmi: user.bmi || null,
      smokingStatus: user.smokingStatus || null,
      alcoholConsumption: user.alcoholConsumption || null,
      heartRate: user.heartRate || null,
      spo2: user.spo2 || null,
      temperature: user.temperature || null,
      hemoglobin: user.hemoglobin || null,
      hba1c: user.hba1c || null,
      cholesterolTotal: user.cholesterolTotal || null,
      creatinine: user.creatinine || null,
      currentMedications: user.currentMedications || [],
      currentConditions: user.currentConditions || [],
    };

    const extractedEntities = extractMedicalEntities(message);

    const patientContext = buildPatientContext(user);

    const allSymptoms = [
      ...extractedEntities.symptoms,
      ...messageHistory
        .filter((m) => m.role === "user")
        .flatMap((m) => extractMedicalEntities(m.content).symptoms),
    ];
    const uniqueSymptoms = [...new Set(allSymptoms)];

    let pipelineData = null;
    let pipelineContext = "";
    let videoURLs = [];

    const pipelineAvailable = await isPipelineAvailable();
    if (
      pipelineAvailable &&
      (uniqueSymptoms.length > 0 ||
        extractedEntities.drugs.length > 0 ||
        extractedEntities.conditions.length > 0)
    ) {
      try {
        pipelineData = await processMedicalQuery(
          message,
          uniqueSymptoms,
          patientContext,
        );
        if (pipelineData) {
          pipelineContext = formatPipelineDataForAI(pipelineData);
          videoURLs = extractVideoURLs(pipelineData);
        }
      } catch (pipelineError) {
        console.error("Medical Pipeline Error:", pipelineError);
      }
    }

    const queryEmbedding = await getEmbedding(message);

    const hits = await queryPinecone(
      queryEmbedding,
      PINECONE_TOP_K,
      PINECONE_INDEX,
    );

    const contexts = hits
      .map(
        (h, i) =>
          `Source ${i + 1}:\n${h.metadata?.text || h.metadata?.content || ""}`,
      )
      .join("\n\n");

    const prompt = `You are a Smart and Compassionate Medical Assistant Designed to Help Users Understand their Symptoms.
    Before Suggesting any Possible Causes, Conditions, or Remedies, You Must Ask 1 Clear and Relevant Question at a Time to Understand the User's Symptoms Better.
    Wait for the User's Response to Each Question Before Asking the Next One, Just Like a Doctor Having a Conversation.
    Ask the User to Upload Any Relevant Medical Diagnostic Reports (e.g., Blood Tests, X-Rays, ECG, MRI, or Other Lab Results) ONLY When it is Relevant based on Their Described Symptoms or Medical Condition.

    IMPORTANT - MEDICAL REPORT ANALYSIS PRIORITY:
    When Analyzing Medical History, ALWAYS Prioritize the MOST RECENTLY UPLOADED REPORT (The Report with the Latest Timestamp).
    The Medical History Below Contains Multiple Reports Separated by Timestamps in the Format: "--- Document Uploaded on [DATE] ---"
    Compare the Latest Report with Previous Reports to Identify Any Concerning Trends, Improvements, or Deteriorations in the Patient's Condition.
    Give Your Analysis and Insights Primarily on the LATEST Report While Using the Previous Reports as Historical Context to Track Changes Over Time.

    CRITICAL - URGENT MEDICAL SITUATION DETECTION:
    You MUST Immediately Identify if the User is Experiencing Any Life-Threatening or Emergency Medical Situations. These Include but are NOT Limited To:
    - Severe Chest Pain, Pressure, or Tightness (Possible Heart Attack)
    - Difficulty Breathing, Shortness of Breath, or Choking
    - Severe Bleeding or Hemorrhaging
    - Loss of Consciousness, Fainting, or Severe Dizziness
    - Stroke Symptoms (Sudden Numbness, Confusion, Speech Problems, Vision Loss, Severe Headache)
    - Severe Allergic Reactions (Anaphylaxis, Swelling of Face/Throat)
    - Severe Burns or Trauma
    - Suspected Poisoning or Drug Overdose
    - Suicidal Thoughts or Severe Mental Health Crisis
    - Severe Abdominal Pain (Possible Appendicitis, Internal Bleeding)
    - High Fever with Severe Symptoms (Above 103°F/39.4°C with Confusion, Seizures, or Stiff Neck)
    - Seizures or Convulsions
    - Severe Head Injury
    - Sudden Severe Pain Anywhere in the Body
    - Active Labor or Pregnancy Complications

    If ANY Emergency Situation is Detected, You MUST Start Your Response with the EXACT Text: "[EMERGENCY_ALERT]"
    Then Provide a Brief, Clear Message Urging Immediate Emergency Medical Attention.

    ENHANCED MEDICAL KNOWLEDGE:
    You have Access to Real-Time Medical Data from Trusted Sources Including Drugs.com, NHS Health A-Z, MedlinePlus, FDA Drug Safety Database, and the Human Phenotype Ontology.
    When the Medical Pipeline Data is Provided Below, USE IT to Enhance your Responses with:
    - Accurate Drug Information, Side Effects, and Interactions
    - Verified Condition Symptoms and When to Seek Help
    - FDA Safety Warnings and Alerts
    - Possible Diagnoses Based on Reported Symptoms
    - Triage Recommendations for Urgency Assessment
    
    ALWAYS cite the Source when Using this Data (e.g., "According to MedlinePlus..." or "FDA Safety Data Indicates...").
    If the Pipeline data Conflicts with your Knowledge, Prefer the Pipeline Data as it is more Current and Specific.

    Use ONLY the Provided Context, User Details, Medical History, Medical Pipeline Data, and Conversation History to Suggest Possible Causes, Common Medicines and Remedies.
    If You Don't have Enough Information, Politely Let the User Know You Cannot Provide a Suggestion Yet and Ask Another Clarifying Question.
    Ensure Your Response is Concise, Friendly, and Easy to Understand. Maintain a Conversational Tone Throughout.

    After Asking a Maximum of 5 Symptom-Related Questions, STOP Asking Further Questions.
    At That Point, Analyze All the Information Collected So Far and Provide the User with a Final Disease or Condition Estimate Based on the Context and Conversation History.
    Present the Most Likely Conditions or Health Issues the User Might Be Experiencing, Explain Them Briefly in Simple Terms, and Offer Next Steps Such As Consulting a Relevant Specialist.

    DISEASE DIAGNOSIS MARKER:
    When Delivering the Final Disease or Condition Estimate, You MUST Include the Special Marker [DISEASE_DIAGNOSED: <condition_name>] Exactly Once in Your Response, Where <condition_name> is the Primary Diagnosed Condition in Simple Terms (e.g., "hypertension", "type 2 diabetes", "migraine", "common cold", "urinary tract infection"). Do NOT Use This Marker at Any Other Point in the Conversation — Only When Providing the Final Diagnosis.

    AVOID Using Markdown Syntax such as Asterisks (*) or Bold Text. Structure the Response Naturally with Proper Line Breaks (Using \\n) Between Sections.

    User Details:
    ${JSON.stringify(userDetails, null, 2)}

    Medical History (Includes Uploaded Medical Reports):
    ${userDetails?.medical_history || "Not Provided"}

    ${
      pipelineContext
        ? `Medical Pipeline Data (Real-Time Information from Trusted Medical Sources):
    ${pipelineContext}`
        : ""
    }

    ${
      videoURLs.length > 0
        ? `Educational Videos Available:
    The Following Educational Videos from NHS are Available for this Topic:
    ${videoURLs.map((v) => `- ${v.title}: ${v.url}`).join("\n    ")}

    IMPORTANT: When Educational Videos are Available, Inform the User that Relevant Educational Videos have been Included Below their Message. These Videos Provide Visual Explanations from Trusted NHS Sources.`
        : ""
    }

    Conversation History:
    ${formattedHistory}

    User:
    ${message}

    Assistant:
    `;

    console.log("Prompt:", prompt);

    const result = await requestQueue.add(async () => {
      return await retryWithBackoff(
        async () => {
          return await model.generateContent(prompt);
        },
        2,
        5000,
      );
    });

    const rawAnswer = result.response.text();

    const diseaseMatch = rawAnswer.match(/\[DISEASE_DIAGNOSED:\s*([^\]]+)\]/i);
    let answerWithRx = rawAnswer
      .replace(/\[DISEASE_DIAGNOSED:[^\]]+\]/i, "")
      .trim();

    if (diseaseMatch) {
      const diagnosedDisease = diseaseMatch[1].trim();
      const fdaDrugs = await fetchDrugsFromFDA(diagnosedDisease);
      if (fdaDrugs && fdaDrugs.length > 0) {
        const structuredRx = await structureDrugPrescriptionWithAI(
          fdaDrugs,
          diagnosedDisease,
          userDetails.age,
        );
        if (structuredRx) {
          answerWithRx = answerWithRx + structuredRx;
        }
      }
    }

    const isEmergency = answerWithRx.includes("[EMERGENCY_ALERT]");
    const cleanedAnswer = answerWithRx.replace("[EMERGENCY_ALERT]", "").trim();

    let chat;
    if (chatId) {
      chat = await db.chat.findUnique({
        where: { id: chatId, userId: user.id },
      });

      if (!chat) {
        return NextResponse.json({ error: "Chat Not Found" }, { status: 404 });
      }

      await db.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    } else {
      const title =
        message.length > 30 ? `${message.substring(0, 30)}...` : message;
      const encryptedTitle = encrypt(title);
      chat = await db.chat.create({
        data: {
          userId: user.id,
          title: encryptedTitle,
        },
      });

      const encryptedSystemMessage = encrypt(
        "Hello! I'm your MedSync AI Assistant. How Can I Help You With Your Medical Questions Today?",
      );
      await db.message.create({
        data: {
          chatId: chat.id,
          role: "ASSISTANT",
          content: encryptedSystemMessage,
        },
      });
    }

    const encryptedUserMessage = encrypt(message);
    await db.message.create({
      data: {
        chatId: chat.id,
        role: "USER",
        content: encryptedUserMessage,
      },
    });

    const encryptedAnswer = encrypt(
      cleanedAnswer || "No Answer Returned from Gemini.",
    );

    await db.message.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: encryptedAnswer,
        isEmergency: isEmergency,
        videos: videoURLs.length > 0 ? videoURLs : null,
      },
    });

    return NextResponse.json({
      answer: cleanedAnswer || "No Answer Returned from Gemini.",
      chatId: chat.id,
      isEmergency: isEmergency,
      videos: videoURLs.length > 0 ? videoURLs : undefined,
    });
  } catch (err) {
    console.error("API /api/chat Error:", err);

    if (
      err.status === 429 &&
      err.message &&
      err.message.includes("exceeded your current quota")
    ) {
      return NextResponse.json(
        {
          error:
            "The AI Service has Reached its Usage Limit. This is a Temporary Issue with the API Quota. Please Try Again Later or Contact Support if this Persists.",
        },
        { status: 503 },
      );
    }

    if (err.status === 429) {
      return NextResponse.json(
        {
          error:
            "The AI Service is Currently Busy. Please Wait a Moment and Try Again.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to Process Your Request at This Time. Please Try Again in a Moment.",
      },
      { status: 500 },
    );
  }
}
