import { resolveMediaUrl } from "@/utils/photoUri";
import useUserStore from "@/utils/stores/userStore";

export { resolveMediaUrl };

/**
 * The signed-in teacher's display identity, sourced from the local user store
 * rather than the social feed snapshot — the snapshot may not have loaded yet,
 * which previously left the composer avatar blank.
 */
export function useCurrentUser() {
  const user = useUserStore((store) => store.user);
  const teacher = useUserStore((store) => store.teacher);

  return {
    user,
    teacher,
    name: user?.name?.trim() || "Teacher",
    photoUri: resolveMediaUrl(teacher?.profile_photo),
  };
}
