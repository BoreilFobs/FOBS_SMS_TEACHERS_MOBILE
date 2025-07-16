import { create } from 'zustand';
import {getUserAndTeacherData, clearUserAndTeacherData} from '@/utils/storage/getUserAndTeacher';

const useUserStore = create((set) => ({
  user: null,
  teacher: null,

  setUser: (user) => set({ user }),
  setTeacher: (teacher) => set({ teacher }),

  loadUserData: async () => {
    const { user, teacher } = await getUserAndTeacherData();
    set({ user, teacher });
  },

  clearUserData: async () => {
    await clearUserAndTeacherData();
    set({ user: null, teacher: null });
  }
}));

export default useUserStore;
