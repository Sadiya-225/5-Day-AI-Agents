/**
 * Medical Pipeline Integration
 *
 * This module integrates with the Python medical data backend
 * to enrich AI chat responses with comprehensive medical information.
 *
 * Features:
 * - Medical NER (Named Entity Recognition) with API verification
 * - 7-Component Confidence Scoring System
 * - Real-time data from OpenFDA, RxNorm, MedlinePlus, NHS, HPO
 * - Drug safety alerts and interactions
 * - Symptom analysis and triage recommendations
 * - Multi-source cross-validation
 */

const PIPELINE_BASE_URL = process.env.MEDICAL_PIPELINE_URL || "http://localhost:8000";

/**
 * Fetch data from the medical pipeline backend
 */
async function fetchFromPipeline(endpoint, options = {}) {
  try {
    const url = `${PIPELINE_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`Pipeline request failed: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Medical pipeline error:", error);
    return null;
  }
}

/**
 * Process a medical query through the full pipeline
 *
 * @param {string} query - The user's message
 * @param {Array} symptoms - List of symptoms extracted from conversation
 * @param {Object} patientContext - Patient context from user profile
 * @returns {Object} Pipeline response with medical data
 */
export async function processMedicalQuery(query, symptoms = [], patientContext = null) {
  const payload = {
    query,
    symptoms: symptoms.map((s) =>
      typeof s === "string" ? { symptom: s } : s
    ),
    patient_context: patientContext,
    include_drug_info: true,
    include_conditions: true,
    include_research: false,
    language: "en",
  };

  return await fetchFromPipeline("/api/pipeline/query", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Quick drug information check
 *
 * @param {string} drugName - Name of the drug
 * @param {Array} patientMedications - Patient's current medications
 * @returns {Object} Drug info and safety data
 */
export async function quickDrugCheck(drugName, patientMedications = []) {
  return await fetchFromPipeline("/api/pipeline/quick-drug-check", {
    method: "POST",
    body: JSON.stringify({
      drug_name: drugName,
      patient_medications: patientMedications,
    }),
  });
}

/**
 * Quick condition information check
 *
 * @param {string} conditionName - Name of the condition
 * @returns {Object} Condition summary and key info
 */
export async function quickConditionCheck(conditionName) {
  return await fetchFromPipeline("/api/pipeline/quick-condition-check", {
    method: "POST",
    body: JSON.stringify({ condition_name: conditionName }),
  });
}

/**
 * Analyze symptoms and get possible diagnoses
 *
 * @param {Array} symptoms - List of symptoms
 * @param {Object} patientContext - Patient context
 * @returns {Object} Diagnoses and triage level
 */
export async function analyzeSymptoms(symptoms, patientContext = null) {
  const payload = {
    symptoms: symptoms.map((s) =>
      typeof s === "string"
        ? { symptom: s, duration: null, severity: null }
        : s
    ),
    patient_context: patientContext,
  };

  return await fetchFromPipeline("/api/pipeline/symptom-analysis", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Check drug safety for a patient
 *
 * @param {string} drugName - Name of the drug
 * @param {Object} patientContext - Patient context
 * @returns {Object} Safety information and warnings
 */
export async function checkDrugSafety(drugName, patientContext = null) {
  const payload = {
    drug_name: drugName,
    patient_context: patientContext,
  };

  return await fetchFromPipeline("/api/pipeline/drug-safety-check", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Search for drug information
 *
 * @param {string} query - Drug name to search
 * @returns {Object} Drug search results
 */
export async function searchDrugs(query) {
  return await fetchFromPipeline(`/api/drugs/search?q=${encodeURIComponent(query)}`);
}

/**
 * Get detailed drug information
 *
 * @param {string} drugName - Name of the drug
 * @returns {Object} Comprehensive drug info
 */
export async function getDrugInfo(drugName) {
  return await fetchFromPipeline(`/api/drugs/info/${encodeURIComponent(drugName)}`);
}

/**
 * Search for health conditions
 *
 * @param {string} query - Condition name to search
 * @returns {Object} Condition search results
 */
export async function searchConditions(query) {
  return await fetchFromPipeline(`/api/conditions/search?q=${encodeURIComponent(query)}`);
}

/**
 * Get detailed condition information
 *
 * @param {string} conditionName - Name of the condition
 * @returns {Object} Comprehensive condition info
 */
export async function getConditionInfo(conditionName) {
  return await fetchFromPipeline(`/api/conditions/info/${encodeURIComponent(conditionName)}`);
}

/**
 * Search MedlinePlus health topics
 *
 * @param {string} query - Search query
 * @returns {Object} MedlinePlus search results
 */
export async function searchMedlinePlus(query) {
  return await fetchFromPipeline(`/api/medlineplus/search?q=${encodeURIComponent(query)}`);
}

/**
 * Check FDA drug safety information
 *
 * @param {string} drugName - Name of the drug
 * @returns {Object} FDA safety data
 */
export async function getFDASafety(drugName) {
  return await fetchFromPipeline(`/api/fda/safety-check/${encodeURIComponent(drugName)}`);
}

/**
 * Map symptom to HPO phenotype
 *
 * @param {string} symptom - Symptom description
 * @returns {Object} Phenotype mapping
 */
export async function mapSymptomToPhenotype(symptom) {
  return await fetchFromPipeline(`/api/phenotype/map-symptom?symptom=${encodeURIComponent(symptom)}`);
}

/**
 * Extract medical entities using backend NER service
 *
 * Uses Medical NER with API verification (RxNorm for drugs, HPO for symptoms)
 * to extract and normalize medical entities from text.
 *
 * @param {string} text - Text to analyze
 * @returns {Object} Extracted entities with confidence scores and metadata
 */
export async function extractEntitiesWithNER(text) {
  return await fetchFromPipeline("/api/pipeline/extract-entities", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

/**
 * Extract video URLs from pipeline response
 *
 * @param {Object} pipelineResponse - Response from the pipeline
 * @returns {Array} Array of video objects with URLs and metadata
 */
export function extractVideoURLs(pipelineResponse) {
  const videos = [];

  if (!pipelineResponse) return videos;

  // Extract videos from condition information
  if (pipelineResponse.condition_info && pipelineResponse.condition_info.length > 0) {
    for (const condition of pipelineResponse.condition_info) {
      if (condition.video_url) {
        videos.push({
          url: condition.video_url,
          title: condition.video?.title || `${condition.name} - Educational Video`,
          description: condition.video?.description || condition.overview || condition.description,
          source: "NHS",
          conditionName: condition.name,
          type: "brightcove"
        });
      }
    }
  }

  return videos;
}

/**
 * Check if the medical pipeline is available
 *
 * @returns {boolean} True if pipeline is available
 */
export async function isPipelineAvailable() {
  try {
    const response = await fetch(`${PIPELINE_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Extract medical entities from text (drugs, conditions, symptoms)
 *
 * @param {string} text - Text to analyze
 * @returns {Object} Extracted entities
 */
export function extractMedicalEntities(text) {
  const entities = {
    drugs: [],
    conditions: [],
    symptoms: [],
  };

  const textLower = text.toLowerCase();

  // Common drug patterns
  const drugPatterns = [
    /taking\s+(\w+)/gi,
    /prescribed\s+(\w+)/gi,
    /medication\s+(?:called\s+)?(\w+)/gi,
    /drug\s+(?:called\s+)?(\w+)/gi,
  ];

  for (const pattern of drugPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        entities.drugs.push(match[1].toLowerCase());
      }
    }
  }

  // Common symptom keywords
  const symptomKeywords = [
    "pain", "ache", "fever", "cough", "headache", "nausea",
    "vomiting", "dizziness", "fatigue", "weakness", "swelling",
    "rash", "itching", "numbness", "tingling", "shortness of breath",
    "chest pain", "abdominal pain", "back pain", "joint pain",
    "sore throat", "runny nose", "congestion", "diarrhea",
    "constipation", "bleeding", "bruising", "weight loss",
    "weight gain", "insomnia", "anxiety", "depression"
  ];

  for (const symptom of symptomKeywords) {
    if (textLower.includes(symptom)) {
      entities.symptoms.push(symptom);
    }
  }

  // Common condition keywords
  const conditionKeywords = [
    "diabetes", "hypertension", "asthma", "arthritis", "cancer",
    "heart disease", "stroke", "depression", "anxiety", "covid",
    "flu", "cold", "infection", "allergy", "migraine", "epilepsy"
  ];

  for (const condition of conditionKeywords) {
    if (textLower.includes(condition)) {
      entities.conditions.push(condition);
    }
  }

  return entities;
}

/**
 * Build patient context from user data
 *
 * @param {Object} user - User data from database
 * @returns {Object} Patient context for pipeline
 */
export function buildPatientContext(user) {
  if (!user) return null;

  const context = {
    age: user.age || null,
    gender: user.gender || null,
    weight: user.weight || null,
    height: user.height || null,
    bmi: user.bmi || null,
    ethnicity: user.ethnicity || null,
    pregnancy_status: user.pregnancyStatus || null,
    smoking_status: user.smokingStatus || null,
    alcohol_consumption: user.alcoholConsumption || null,
    current_medications: [],
    current_conditions: [],
    allergies: [],
    vital_signs: null,
    lab_values: null,
  };

  // Parse current medications
  if (user.currentMedications) {
    if (Array.isArray(user.currentMedications)) {
      context.current_medications = user.currentMedications
        .map(m => m.text || m.name || m)
        .filter(Boolean);
    }
  }

  // Parse current conditions
  if (user.currentConditions) {
    if (Array.isArray(user.currentConditions)) {
      context.current_conditions = user.currentConditions
        .map(c => c.text || c.name || c)
        .filter(Boolean);
    }
  }

  // Parse allergies
  if (user.allergies) {
    context.allergies = user.allergies.split(",").map(a => a.trim()).filter(Boolean);
  }

  // Build vital signs
  if (user.bp_sys || user.bp_dia || user.heartRate || user.spo2 || user.temperature) {
    context.vital_signs = {
      bp_sys: user.bp_sys,
      bp_dia: user.bp_dia,
      heart_rate: user.heartRate,
      spo2: user.spo2,
      temperature: user.temperature,
      respiratory_rate: user.respiratoryRate,
      sugar_fasting: user.sugar_fasting,
      sugar_pp: user.sugar_pp,
    };
  }

  // Build lab values
  if (user.hemoglobin || user.hba1c || user.cholesterolTotal) {
    context.lab_values = {
      hemoglobin: user.hemoglobin,
      hba1c: user.hba1c,
      cholesterol_total: user.cholesterolTotal,
      ldl: user.ldl,
      hdl: user.hdl,
      triglycerides: user.triglycerides,
      creatinine: user.creatinine,
      egfr: user.egfr,
    };
  }

  return context;
}

/**
 * Format pipeline data for AI context
 *
 * @param {Object} pipelineResponse - Response from the pipeline
 * @returns {string} Formatted context string
 */
export function formatPipelineDataForAI(pipelineResponse) {
  if (!pipelineResponse) return "";

  const parts = [];

  // Extracted entities from NER
  if (pipelineResponse.extracted_entities) {
    const entities = pipelineResponse.extracted_entities;
    const entityParts = [];

    if (entities.drugs && entities.drugs.length > 0) {
      entityParts.push(`Drugs: ${entities.drugs.join(", ")}`);
    }
    if (entities.symptoms && entities.symptoms.length > 0) {
      entityParts.push(`Symptoms: ${entities.symptoms.join(", ")}`);
    }
    if (entities.conditions && entities.conditions.length > 0) {
      entityParts.push(`Conditions: ${entities.conditions.join(", ")}`);
    }
    if (entities.anatomy && entities.anatomy.length > 0) {
      entityParts.push(`Anatomy: ${entities.anatomy.join(", ")}`);
    }

    if (entityParts.length > 0) {
      parts.push("EXTRACTED MEDICAL ENTITIES (NER):");
      parts.push(entityParts.join(" | "));
    }
  }

  // Confidence assessment
  if (pipelineResponse.confidence_details) {
    const conf = pipelineResponse.confidence_details;
    parts.push(`\nCONFIDENCE ASSESSMENT: ${conf.interpretation} (Score: ${Math.round(conf.overall_confidence * 100)}%)`);

    if (conf.recommendations && conf.recommendations.length > 0) {
      parts.push(`Recommendations: ${conf.recommendations.slice(0, 2).join("; ")}`);
    }
  }

  // Drug information - COMPREHENSIVE FDA DATA
  if (pipelineResponse.drug_info && pipelineResponse.drug_info.length > 0) {
    parts.push("\nDRUG INFORMATION (FDA):");
    for (const drug of pipelineResponse.drug_info) {
      parts.push(`\n- ${drug.basic_info?.name || "Unknown"}`);

      // Generic and brand names
      if (drug.basic_info?.generic_name) {
        parts.push(`  Generic: ${drug.basic_info.generic_name}`);
      }
      if (drug.basic_info?.brand_names && drug.basic_info.brand_names.length > 0) {
        parts.push(`  Brands: ${drug.basic_info.brand_names.slice(0, 5).join(", ")}`);
      }

      // Drug class
      if (drug.basic_info?.drug_class) {
        parts.push(`  Class: ${drug.basic_info.drug_class}`);
      }

      // Description/Purpose
      if (drug.basic_info?.description) {
        parts.push(`  Description: ${drug.basic_info.description.slice(0, 300)}`);
      }
      if (drug.basic_info?.purpose && drug.basic_info.purpose.length > 0) {
        parts.push(`  Purpose: ${drug.basic_info.purpose.slice(0, 200)}`);
      }

      // Dosage information
      if (drug.dosage && drug.dosage.length > 0) {
        const dosageInfo = drug.dosage.slice(0, 3).map(d => d.form || d.strength || d).join("; ");
        parts.push(`  Dosage Forms: ${dosageInfo}`);
      }

      // Warnings (CRITICAL)
      if (drug.warnings && drug.warnings.length > 0) {
        const warnings = drug.warnings.slice(0, 5).map(w => w.description || w.warning || w).filter(w => w && w.length > 5);
        if (warnings.length > 0) {
          parts.push(`  ⚠️ Warnings: ${warnings.slice(0, 3).join("; ")}`);
        }
      }

      // Contraindications (CRITICAL)
      if (drug.contraindications && drug.contraindications.length > 0) {
        parts.push(`  🚫 Contraindications: ${drug.contraindications.slice(0, 3).join("; ")}`);
      }

      // Side effects
      if (drug.side_effects && drug.side_effects.length > 0) {
        const sideEffects = drug.side_effects.slice(0, 8).map(s => s.effect || s).join(", ");
        parts.push(`  Side Effects: ${sideEffects}`);
      }

      // Drug interactions
      if (drug.interactions && drug.interactions.length > 0) {
        const interactions = drug.interactions.slice(0, 5).map(i => i.interacting_drug || i.drug || i).join(", ");
        parts.push(`  Interactions: May interact with ${interactions}`);
      }

      // Pregnancy/breastfeeding warnings
      if (drug.pregnancy_category) {
        parts.push(`  Pregnancy Category: ${drug.pregnancy_category}`);
      }

      // Storage and handling
      if (drug.storage && drug.storage.length > 0) {
        parts.push(`  Storage: ${drug.storage.slice(0, 150)}`);
      }
    }
  }

  // Condition information - COMPREHENSIVE DATA FROM NHS
  if (pipelineResponse.condition_info && pipelineResponse.condition_info.length > 0) {
    parts.push("\nCONDITION INFORMATION (NHS):");
    for (const condition of pipelineResponse.condition_info) {
      parts.push(`\n- ${condition.name}`);

      // Overview and description
      if (condition.overview) {
        parts.push(`  Overview: ${condition.overview.slice(0, 300)}`);
      } else if (condition.description) {
        parts.push(`  Description: ${condition.description.slice(0, 300)}`);
      }

      // Symptoms
      if (condition.symptoms && condition.symptoms.length > 0) {
        parts.push(`  Symptoms: ${condition.symptoms.slice(0, 8).map(s => s.symptom || s).join(", ")}`);
      }

      // Causes
      if (condition.causes && condition.causes.length > 0) {
        parts.push(`  Causes: ${condition.causes.slice(0, 5).join("; ")}`);
      }

      // Risk factors
      if (condition.risk_factors && condition.risk_factors.length > 0) {
        parts.push(`  Risk Factors: ${condition.risk_factors.slice(0, 5).join(", ")}`);
      }

      // Treatments
      if (condition.treatments && condition.treatments.length > 0) {
        const treatments = condition.treatments.slice(0, 5).map(t => t.treatment || t.name || t).join(", ");
        parts.push(`  Treatments: ${treatments}`);
      }

      // Self-care recommendations
      if (condition.self_care && condition.self_care.length > 0) {
        parts.push(`  Self-care: ${condition.self_care.slice(0, 3).join("; ")}`);
      }

      // Prevention
      if (condition.prevention && condition.prevention.length > 0) {
        parts.push(`  Prevention: ${condition.prevention.slice(0, 3).join("; ")}`);
      }

      // Types of condition
      if (condition.types && condition.types.length > 0) {
        const types = condition.types.slice(0, 3).map(t => t.type || t.name || t).join(", ");
        parts.push(`  Types: ${types}`);
      }

      // Complications
      if (condition.complications && condition.complications.length > 0) {
        parts.push(`  Complications: ${condition.complications.slice(0, 3).join("; ")}`);
      }

      // When to seek help (CRITICAL)
      if (condition.when_to_seek_help && condition.when_to_seek_help.length > 0) {
        parts.push(`  ⚠️ When to seek help: ${condition.when_to_seek_help.slice(0, 3).join("; ")}`);
      }

      // Urgent advice (CRITICAL)
      if (condition.urgent_advice && condition.urgent_advice.length > 0) {
        parts.push(`  🚨 URGENT: ${condition.urgent_advice.slice(0, 3).join("; ")}`);
      }

      // Video information
      if (condition.video_url) {
        parts.push(`  📹 Educational Video Available: ${condition.video_url}`);
        if (condition.video && condition.video.title) {
          parts.push(`     Video Title: ${condition.video.title}`);
        }
      }

      // Related conditions
      if (condition.related_conditions && condition.related_conditions.length > 0) {
        const related = condition.related_conditions.slice(0, 3).map(r => r.title || r.name || r).join(", ");
        parts.push(`  Related: ${related}`);
      }
    }
  }

  // Diagnoses
  if (pipelineResponse.diagnoses && pipelineResponse.diagnoses.length > 0) {
    parts.push("\nPOSSIBLE CONDITIONS (Based on Symptoms):");
    for (const diagnosis of pipelineResponse.diagnoses.slice(0, 5)) {
      parts.push(`- ${diagnosis.condition} (confidence: ${Math.round(diagnosis.confidence * 100)}%)`);
    }
  }

  // FDA Adverse Events and Alerts
  if (pipelineResponse.fda_alerts && pipelineResponse.fda_alerts.length > 0) {
    parts.push("\nFDA ADVERSE EVENT REPORTS:");
    for (const alert of pipelineResponse.fda_alerts.slice(0, 5)) {
      if (alert.reactions && alert.reactions.length > 0) {
        parts.push(`- Reported reactions: ${alert.reactions.slice(0, 5).join(", ")}`);
      }
      if (alert.serious) {
        parts.push(`  ⚠️ Serious event reported`);
      }
    }
  }

  // Safety warnings
  if (pipelineResponse.safety_warnings && pipelineResponse.safety_warnings.length > 0) {
    parts.push("\nSAFETY WARNINGS:");
    for (const warning of pipelineResponse.safety_warnings) {
      parts.push(`⚠️ ${warning}`);
    }
  }

  // Triage recommendation
  if (pipelineResponse.triage_recommendation) {
    parts.push(`\nTRIAGE LEVEL: ${pipelineResponse.triage_recommendation.toUpperCase()}`);
  }

  // MedlinePlus results - COMPREHENSIVE HEALTH TOPICS
  if (pipelineResponse.medlineplus_results && pipelineResponse.medlineplus_results.length > 0) {
    parts.push("\nRELATED HEALTH TOPICS (MedlinePlus/NIH):");
    for (const result of pipelineResponse.medlineplus_results.slice(0, 5)) {
      parts.push(`\n- ${result.title}`);

      // Summary or snippet
      if (result.summary) {
        parts.push(`  ${result.summary.slice(0, 250)}`);
      } else if (result.snippet) {
        parts.push(`  ${result.snippet.slice(0, 250)}`);
      }

      // Full summary if available and different
      if (result.full_summary && result.full_summary !== result.summary) {
        parts.push(`  Details: ${result.full_summary.slice(0, 200)}`);
      }

      // Organization/source
      if (result.organization_name) {
        parts.push(`  Source: ${result.organization_name}`);
      }

      // URL for reference
      if (result.url) {
        parts.push(`  Reference: ${result.url}`);
      }
    }
  }

  // Prescription suggestions (if available)
  if (pipelineResponse.prescriptions && pipelineResponse.prescriptions.length > 0) {
    parts.push("\nTREATMENT SUGGESTIONS:");
    for (const prescription of pipelineResponse.prescriptions.slice(0, 3)) {
      parts.push(`- ${prescription.drug_name || prescription.name}`);
      if (prescription.dosage) {
        parts.push(`  Suggested dosage: ${prescription.dosage}`);
      }
      if (prescription.rationale) {
        parts.push(`  Rationale: ${prescription.rationale}`);
      }
    }
  }

  // Follow-up questions to ask the patient
  if (pipelineResponse.follow_up_questions && pipelineResponse.follow_up_questions.length > 0) {
    parts.push("\nSUGGESTED FOLLOW-UP QUESTIONS:");
    for (const question of pipelineResponse.follow_up_questions.slice(0, 3)) {
      parts.push(`- ${question}`);
    }
  }

  // Patient context summary
  if (pipelineResponse.context_summary) {
    parts.push(`\nPATIENT CONTEXT: ${pipelineResponse.context_summary}`);
  }

  return parts.join("\n");
}
