import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserAndTeacherData = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    const teacherData = await AsyncStorage.getItem('teacher');

    const user = userData ? JSON.parse(userData) : null;
    const teacher = teacherData ? JSON.parse(teacherData) : null;
    
    return { user, teacher };
  } catch (error) {
    console.error('Failed to load user or teacher data:', error);
    return { user: null, teacher: null };
  }
};

export const clearUserAndTeacherData = async () => {
  try {
    await AsyncStorage.multiRemove(['user', 'teacher']);
    console.log('User and teacher data cleared.');
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
};

