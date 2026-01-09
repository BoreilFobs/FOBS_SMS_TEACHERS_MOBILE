import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'fr';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

const translations: Translations = {
  // Common
  app_name: { en: 'FobsSMS Teachers', fr: 'FobsSMS Enseignants' },
  loading: { en: 'Loading...', fr: 'Chargement...' },
  error: { en: 'Error', fr: 'Erreur' },
  success: { en: 'Success', fr: 'Succès' },
  cancel: { en: 'Cancel', fr: 'Annuler' },
  ok: { en: 'OK', fr: 'OK' },
  save: { en: 'Save', fr: 'Enregistrer' },
  delete: { en: 'Delete', fr: 'Supprimer' },
  edit: { en: 'Edit', fr: 'Modifier' },
  close: { en: 'Close', fr: 'Fermer' },
  back: { en: 'Back', fr: 'Retour' },
  next: { en: 'Next', fr: 'Suivant' },
  done: { en: 'Done', fr: 'Terminé' },
  search: { en: 'Search', fr: 'Rechercher' },
  no_results: { en: 'No results found', fr: 'Aucun résultat trouvé' },
  retry: { en: 'Retry', fr: 'Réessayer' },
  
  // Navigation
  home: { en: 'Home', fr: 'Accueil' },
  marks: { en: 'Marks', fr: 'Notes' },
  attendance: { en: 'Attendance', fr: 'Présences' },
  profile: { en: 'Profile', fr: 'Profil' },
  settings: { en: 'Settings', fr: 'Paramètres' },
  
  // Home Screen
  good_morning: { en: 'Good Morning', fr: 'Bonjour' },
  good_afternoon: { en: 'Good Afternoon', fr: 'Bon après-midi' },
  good_evening: { en: 'Good Evening', fr: 'Bonsoir' },
  overview: { en: 'Overview', fr: "Vue d'ensemble" },
  quick_actions: { en: 'Quick Actions', fr: 'Actions rapides' },
  todays_schedule: { en: "Today's Schedule", fr: "Emploi du temps" },
  recent_activity: { en: 'Recent Activity', fr: 'Activité récente' },
  see_all: { en: 'See All', fr: 'Voir tout' },
  no_classes_scheduled: { en: 'No classes scheduled', fr: 'Pas de cours programmé' },
  
  // Stats
  classes: { en: 'Classes', fr: 'Classes' },
  students: { en: 'Students', fr: 'Élèves' },
  pending_marks: { en: 'Pending Marks', fr: 'Notes en attente' },
  attendance_today: { en: 'Attendance', fr: 'Présences' },
  
  // Quick Actions
  enter_marks: { en: 'Enter Marks', fr: 'Saisir Notes' },
  take_attendance: { en: 'Attendance', fr: 'Présences' },
  view_reports: { en: 'Reports', fr: 'Rapports' },
  view_students: { en: 'Students', fr: 'Élèves' },
  
  // School Switcher
  switch_school: { en: 'Switch School', fr: "Changer d'école" },
  current_school: { en: 'Current School', fr: 'École actuelle' },
  recent: { en: 'Recent', fr: 'Récent' },
  all_schools: { en: 'All Schools', fr: 'Toutes les écoles' },
  add_school: { en: 'Add School', fr: 'Ajouter une école' },
  switching: { en: 'Switching...', fr: 'Changement...' },
  switch: { en: 'Switch', fr: 'Changer' },
  
  // Marks
  subjects: { en: 'Subjects', fr: 'Matières' },
  select_subject: { en: 'Select Subject', fr: 'Choisir Matière' },
  select_class: { en: 'Select Class', fr: 'Choisir Classe' },
  select_exam: { en: 'Select Exam', fr: 'Choisir Examen' },
  enter_student_marks: { en: 'Enter Student Marks', fr: 'Saisir les notes' },
  marks_saved: { en: 'Marks saved successfully', fr: 'Notes enregistrées' },
  save_marks: { en: 'Save Marks', fr: 'Enregistrer' },
  mark: { en: 'Mark', fr: 'Note' },
  out_of: { en: 'out of', fr: 'sur' },
  progress: { en: 'Progress', fr: 'Progression' },
  
  // Attendance
  take_class_attendance: { en: 'Take Class Attendance', fr: 'Prendre les présences' },
  present: { en: 'Present', fr: 'Présent' },
  absent: { en: 'Absent', fr: 'Absent' },
  late: { en: 'Late', fr: 'En retard' },
  excused: { en: 'Excused', fr: 'Excusé' },
  mark_all_present: { en: 'Mark All Present', fr: 'Tous présents' },
  mark_all_absent: { en: 'Mark All Absent', fr: 'Tous absents' },
  attendance_saved: { en: 'Attendance saved successfully', fr: 'Présences enregistrées' },
  hours: { en: 'Hours', fr: 'Heures' },
  submit_attendance: { en: 'Submit Attendance', fr: 'Enregistrer' },
  
  // Settings
  account: { en: 'Account', fr: 'Compte' },
  preferences: { en: 'Preferences', fr: 'Préférences' },
  support: { en: 'Support', fr: 'Aide' },
  edit_profile: { en: 'Edit Profile', fr: 'Modifier le profil' },
  change_password: { en: 'Change Password', fr: 'Changer le mot de passe' },
  language: { en: 'Language', fr: 'Langue' },
  notifications: { en: 'Notifications', fr: 'Notifications' },
  dark_mode: { en: 'Dark Mode', fr: 'Mode sombre' },
  help: { en: 'Help & Support', fr: 'Aide & Support' },
  about: { en: 'About', fr: 'À propos' },
  rate_us: { en: 'Rate Us', fr: 'Noter l\'app' },
  logout: { en: 'Logout', fr: 'Déconnexion' },
  logout_confirm: { en: 'Are you sure you want to logout?', fr: 'Voulez-vous vraiment vous déconnecter ?' },
  
  // Profile
  my_statistics: { en: 'My Statistics', fr: 'Mes statistiques' },
  classes_assigned: { en: 'Classes assigned', fr: 'Classes assignées' },
  students_total: { en: 'Students total', fr: 'Élèves au total' },
  marks_submitted: { en: 'Marks submitted', fr: 'Notes saisies' },
  
  // Auth
  login: { en: 'Login', fr: 'Connexion' },
  email: { en: 'Email', fr: 'Email' },
  password: { en: 'Password', fr: 'Mot de passe' },
  forgot_password: { en: 'Forgot Password?', fr: 'Mot de passe oublié ?' },
  
  // Errors
  network_error: { en: 'Network error occurred', fr: 'Erreur de connexion' },
  try_again: { en: 'Please try again', fr: 'Veuillez réessayer' },
  no_data: { en: 'No data available', fr: 'Aucune donnée disponible' },
  
  // Version
  version: { en: 'Version', fr: 'Version' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage === 'en' || savedLanguage === 'fr') {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
