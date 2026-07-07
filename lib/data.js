import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";

export const features = [
  {
    icon: <User className="h-6 w-6 text-emerald-400" />,
    title: "Create Your Profile",
    description:
      "Sign Up and Complete your Profile to get Personalized Healthcare Recommendations and Services.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-emerald-400" />,
    title: "Book Appointments",
    description:
      "Browse Doctor Profiles, Check Availability, and Book Appointments that Fit your Schedule.",
  },
  {
    icon: <Video className="h-6 w-6 text-emerald-400" />,
    title: "Video Consultation",
    description:
      "Connect with Doctors through Secure, High-Quality Video Consultations from the Comfort of your Home.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
    title: "Consultation Credits",
    description:
      "Purchase Credit Packages that Fit your Healthcare Needs with our Simple Subscription Model.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
    title: "Verified Doctors",
    description:
      "All Healthcare Providers are Carefully Vetted and Verified to Ensure Quality Care.",
  },
  {
    icon: <FileText className="h-6 w-6 text-emerald-400" />,
    title: "Medical Documentation",
    description:
      "Access and Manage Your Appointment History, Doctor's Notes, and Medical Recommendations.",
  },
];

export const testimonials = [
  {
    initials: "RA",
    name: "Riya A.",
    role: "Patient",
    quote:
      "Booking a Video Consultation Saved Me a Lot of Hassle. I got Advice from a Certified Doctor While Sitting at Home in Hyderabad.",
  },
  {
    initials: "AM",
    name: "Anita M.",
    role: "Patient",
    quote:
      "The Wallet System is Super Useful. I Added Credits Once and Could Easily Book Consultations for My Parents in Delhi Without any Issues.",
  },
  {
    initials: "VS",
    name: "Dr. Vinod S.",
    role: "Dermatologist",
    quote:
      "Earlier I Could Only Treat Local Patients, but Now I Consult People from All Over India - from Mumbai to Guwahati - Thanks to this Platform.",
  },
];

export const creditBenefits = [
  "Pay <strong class='text-emerald-400'>Per Consultation</strong> - No Upfront Subscription Needed",
  "Each Appointment has a <strong class='text-emerald-400'>Transparent Fixed Fee</strong>",
  "No <strong class='text-emerald-400'>Hidden Charges</strong> or Recurring Payments",
  "Book Consultations <strong class='text-emerald-400'>Anytime</strong>, Only When You Need Them",
];
