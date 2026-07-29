export interface Qualification {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  graduationYear: number;
  distinction?: string;
  documentStatus: "not-added" | "pending" | "verified";
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialNumber?: string;
  status: "self-declared" | "pending" | "verified";
}

export interface ProfessionalExperience {
  id: string;
  organization: string;
  role: string;
  subjects: string[];
  levels: string[];
  startDate: string;
  endDate?: string;
  current: boolean;
  responsibilities: string;
  achievements?: string;
}

export interface ProfessionalLanguage {
  id: string;
  name: string;
  spoken: "Basic" | "Intermediate" | "Advanced" | "Fluent";
  written: "Basic" | "Intermediate" | "Advanced" | "Fluent";
  usedForTeaching: boolean;
}

export interface ProfessionalDocument {
  id: string;
  kind: "CV" | "Degree certificate" | "Professional certificate" | "Other";
  title: string;
  updatedAt: string;
  status: "metadata-only" | "pending" | "verified";
  private: true;
}

export interface ProfileVisibility {
  professionalEmail: boolean;
  professionalPhone: boolean;
  currentSchools: boolean;
}

export interface ProfessionalProfile {
  headline: string;
  city: string;
  biography: string;
  primaryField: string;
  additionalFields: string[];
  subjects: string[];
  levels: string[];
  expertise: string[];
  teachingLanguages: string[];
  skills: string[];
  qualifications: Qualification[];
  certifications: Certification[];
  experience: ProfessionalExperience[];
  languages: ProfessionalLanguage[];
  documents: ProfessionalDocument[];
  professionalEmail?: string;
  professionalPhone?: string;
  visibility: ProfileVisibility;
  verified: boolean;
}

export type ProfileSectionKey =
  | "summary"
  | "qualifications"
  | "certifications"
  | "experience"
  | "specializations"
  | "skills"
  | "languages"
  | "documents"
  | "visibility";

