// src/stores/userStore.js
import { create } from 'zustand';
import getUserAndTeacherData from '@/utils/storage/getUserAndTeacher';

const useUserStore = create((set) => ({
  user: null,
  teacher: null,
  loadUserData: async () => {
    const { user, teacher } = await getUserAndTeacherData();
    set({ user, teacher });
  },
}));

export default useUserStore;
