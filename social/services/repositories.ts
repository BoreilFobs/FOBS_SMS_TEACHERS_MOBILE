import { socialRepository } from "@/social/mock/repositories/InMemorySocialRepository";

// This is the only binding screens/hooks consume. A Laravel-backed implementation can
// replace this object without changing social UI components.
export const socialRepositories = socialRepository;
