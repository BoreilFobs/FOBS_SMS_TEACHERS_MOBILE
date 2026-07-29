// School object from the response
export interface School {
  id: number;
  name: string;
  acronym: string;
  address: string;
  logo_url: string;
  email: string;
  phone: string;
  code?: string;
  status?: string;
  academic_year?: string;
  academic_year_id?: number;
}

// Teacher-school relationship object
export interface TeacherSchool {
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolResponse {
  school: School;
  teacher_school: TeacherSchool;
}

// Full API response structure
export type TeacherSchoolResponse = {
  success: boolean;
  data: SchoolResponse[];
};
