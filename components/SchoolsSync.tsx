import { useEffect } from "react";
import { useSchools } from "@/hooks/useSchools";
import useSchoolStore from "@/utils/stores/schoolStore";
import useUserStore from "@/utils/stores/userStore";
import { useOutboxSync } from "@/hooks/useOutbox";

/**
 * Hydrates the stores every screen reads from. Mounted once at the root so
 * both sections see the same data — the management screens key their queries
 * off `teacher.id`, and silently render empty states when it is missing.
 */
export default function SchoolsSync() {
  const { schoolData, loading } = useSchools();
  const setSchools = useSchoolStore((state) => state.setSchools);
  const user = useUserStore((state) => state.user);
  const teacher = useUserStore((state) => state.teacher);
  const loadUserData = useUserStore((state) => state.loadUserData);

  // Replays marks and attendance saved while offline.
  useOutboxSync();

  useEffect(() => {
    if (!user || !teacher) void loadUserData();
  }, [user, teacher, loadUserData]);

  useEffect(() => {
    if (loading) return;
    setSchools(
      schoolData.map((item) => ({
        id: item.school.id,
        name: item.school.name,
        code: item.school.acronym || item.school.code || "",
        logo: item.school.logo_url || undefined,
        address: item.school.address,
        phone: item.school.phone,
        email: item.school.email,
        academic_year: item.school.academic_year,
        academic_year_id: item.school.academic_year_id,
        status: "active" as const,
        pivot: {
          is_approved: Boolean(item.teacher_school.isActive),
          created_at: item.teacher_school.created_at,
        },
      })),
    );
  }, [schoolData, loading, setSchools]);

  return null;
}
