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
  all: { en: 'All', fr: 'Tous' },
  retry: { en: 'Retry', fr: 'Réessayer' },
  
  // Navigation
  home: { en: 'Home', fr: 'Accueil' },
  marks: { en: 'Marks', fr: 'Notes' },
  attendance: { en: 'Attendance', fr: 'Présences' },
  profile: { en: 'Profile', fr: 'Profil' },
  settings: { en: 'Settings', fr: 'Paramètres' },
  network: { en: 'Network', fr: 'Réseau' },
  create: { en: 'Create', fr: 'Créer' },
  jobs: { en: 'Jobs', fr: 'Emplois' },
  my_schools: { en: 'My Schools', fr: 'Mes écoles' },
  messages: { en: 'Messages', fr: 'Messages' },
  social_feed: { en: 'Teacher network', fr: 'Réseau des enseignants' },
  discover: { en: 'Discover teachers, posts and jobs', fr: 'Découvrir des enseignants, publications et emplois' },
  write_post: { en: 'Share an idea or ask a question', fr: 'Partagez une idée ou posez une question' },
  recommended: { en: 'Recommended', fr: 'Recommandé' },
  offline_hint: { en: 'You appear to be offline. Session content remains available.', fr: 'Vous semblez hors ligne. Le contenu de la session reste disponible.' },
  feed_empty: { en: 'Your professional feed is ready for new ideas.', fr: 'Votre fil professionnel attend de nouvelles idées.' },
  feed_error: { en: 'The social feed could not be loaded.', fr: 'Le fil social n’a pas pu être chargé.' },
  load_more: { en: 'Load more', fr: 'Voir plus' },
  post: { en: 'Post', fr: 'Publication' },
  posting: { en: 'Publishing…', fr: 'Publication…' },
  post_published: { en: 'Your post is now in the feed.', fr: 'Votre publication est maintenant dans le fil.' },
  post_updated: { en: 'Post updated.', fr: 'Publication modifiée.' },
  post_deleted: { en: 'Post deleted.', fr: 'Publication supprimée.' },
  delete_post_confirm: { en: 'Delete this post? This cannot be undone.', fr: 'Supprimer cette publication ? Cette action est irréversible.' },
  edited: { en: 'Edited', fr: 'Modifié' },
  text_post: { en: 'Text', fr: 'Texte' },
  image_post: { en: 'Image', fr: 'Image' },
  poll: { en: 'Poll', fr: 'Sondage' },
  question: { en: 'Question', fr: 'Question' },
  professional_question: { en: 'Professional question', fr: 'Question professionnelle' },
  post_text_placeholder: { en: 'What would you like to share with fellow teachers?', fr: 'Que souhaitez-vous partager avec les autres enseignants ?' },
  question_title: { en: 'Primary question', fr: 'Question principale' },
  question_details: { en: 'Context and details', fr: 'Contexte et détails' },
  poll_question: { en: 'Poll question', fr: 'Question du sondage' },
  poll_option: { en: 'Answer option', fr: 'Option de réponse' },
  add_option: { en: 'Add option', fr: 'Ajouter une option' },
  multiple_choice: { en: 'Allow multiple choices', fr: 'Autoriser plusieurs choix' },
  category: { en: 'Subject or category', fr: 'Matière ou catégorie' },
  school_affiliation: { en: 'School affiliation', fr: 'Établissement associé' },
  location: { en: 'Location', fr: 'Lieu' },
  tag_teachers: { en: 'Tag teachers', fr: 'Identifier des enseignants' },
  add_images: { en: 'Add images', fr: 'Ajouter des images' },
  remove_image: { en: 'Remove image', fr: 'Retirer l’image' },
  reaction_like: { en: 'Like', fr: 'J’aime' },
  reaction_love: { en: 'Love', fr: 'J’adore' },
  reaction_support: { en: 'Support', fr: 'Soutien' },
  reaction_insightful: { en: 'Insightful', fr: 'Pertinent' },
  reaction_celebrate: { en: 'Celebrate', fr: 'Bravo' },
  react: { en: 'React', fr: 'Réagir' },
  comment: { en: 'Comment', fr: 'Commenter' },
  comments: { en: 'Comments', fr: 'Commentaires' },
  reply: { en: 'Reply', fr: 'Répondre' },
  add_comment: { en: 'Write a comment…', fr: 'Écrire un commentaire…' },
  comment_deleted: { en: 'This comment was deleted', fr: 'Ce commentaire a été supprimé' },
  no_comments: { en: 'Start a constructive conversation.', fr: 'Lancez une conversation constructive.' },
  share: { en: 'Share', fr: 'Partager' },
  reshare: { en: 'Reshare', fr: 'Republier' },
  reshare_now: { en: 'Reshare now', fr: 'Republier maintenant' },
  quote_post: { en: 'Add your thoughts', fr: 'Ajouter votre avis' },
  original_unavailable: { en: 'The original post is no longer available.', fr: 'La publication originale n’est plus disponible.' },
  saved: { en: 'Saved', fr: 'Enregistré' },
  saved_posts: { en: 'Saved posts', fr: 'Publications enregistrées' },
  save_post: { en: 'Save', fr: 'Enregistrer' },
  report: { en: 'Report', fr: 'Signaler' },
  reported: { en: 'Reported', fr: 'Signalé' },
  report_post: { en: 'Report post', fr: 'Signaler la publication' },
  report_confirmed: { en: 'Report submitted. The post remains visible while it is reviewed.', fr: 'Signalement envoyé. La publication reste visible pendant son examen.' },
  report_spam: { en: 'Spam', fr: 'Contenu indésirable' },
  report_misleading: { en: 'Misleading information', fr: 'Information trompeuse' },
  report_harassment: { en: 'Harassment', fr: 'Harcèlement' },
  report_inappropriate: { en: 'Inappropriate content', fr: 'Contenu inapproprié' },
  report_impersonation: { en: 'Impersonation', fr: 'Usurpation d’identité' },
  report_other: { en: 'Other', fr: 'Autre' },
  block: { en: 'Block', fr: 'Bloquer' },
  unblock: { en: 'Unblock', fr: 'Débloquer' },
  block_confirm: { en: 'Block this teacher? Their content and messages will be hidden.', fr: 'Bloquer cet enseignant ? Son contenu et ses messages seront masqués.' },
  blocked_accounts: { en: 'Blocked accounts', fr: 'Comptes bloqués' },
  no_blocked_accounts: { en: 'You have not blocked anyone.', fr: 'Vous n’avez bloqué personne.' },
  follow: { en: 'Follow', fr: 'Suivre' },
  following: { en: 'Following', fr: 'Abonnements' },
  followers: { en: 'Followers', fr: 'Abonnés' },
  unfollow: { en: 'Unfollow', fr: 'Ne plus suivre' },
  mutual_follow: { en: 'You follow each other', fr: 'Vous vous suivez mutuellement' },
  // Added by the API migration: real network conditions the mock never produced.
  mutual_follow_required: { en: 'You must follow each other to message', fr: 'Vous devez vous suivre mutuellement pour discuter' },
  offline_title: { en: 'No connection', fr: 'Aucune connexion' },
  offline_retry: { en: 'Check your connection and try again.', fr: 'Vérifiez votre connexion et réessayez.' },
  uploading_images: { en: 'Uploading images…', fr: 'Téléversement des images…' },
  upload_failed: { en: 'Some images could not be uploaded.', fr: 'Certaines images n’ont pas pu être téléversées.' },
  retry_upload: { en: 'Retry upload', fr: 'Réessayer le téléversement' },
  already_reported: { en: 'You have already reported this post.', fr: 'Vous avez déjà signalé cette publication.' },
  suggested_teachers: { en: 'Suggested teachers', fr: 'Enseignants suggérés' },
  trending_teachers: { en: 'Trending teachers', fr: 'Enseignants populaires' },
  subject_categories: { en: 'Browse by subject', fr: 'Explorer par matière' },
  no_teachers: { en: 'No teachers match this view.', fr: 'Aucun enseignant ne correspond à cette vue.' },
  professional_profile: { en: 'Professional profile', fr: 'Profil professionnel' },
  years_experience: { en: 'years of experience', fr: 'années d’expérience' },
  message: { en: 'Message', fr: 'Message' },
  mutual_required: { en: 'Messaging is available when you follow each other.', fr: 'La messagerie est disponible lorsque vous vous suivez mutuellement.' },
  conversation_empty: { en: 'No conversations yet. Follow each other to start messaging.', fr: 'Aucune conversation. Suivez-vous mutuellement pour commencer.' },
  new_message: { en: 'New message', fr: 'Nouveau message' },
  type_message: { en: 'Write a message…', fr: 'Écrire un message…' },
  read: { en: 'Read', fr: 'Lu' },
  delivered_mock: { en: 'Session message', fr: 'Message de session' },
  internal_share: { en: 'Send in a conversation', fr: 'Envoyer dans une conversation' },
  no_eligible_conversations: { en: 'No mutual-follow conversations are available.', fr: 'Aucune conversation avec abonnement mutuel n’est disponible.' },
  job_search: { en: 'Search jobs or schools', fr: 'Rechercher un emploi ou une école' },
  recommended_jobs: { en: 'Recommended jobs', fr: 'Emplois recommandés' },
  recent_jobs: { en: 'Recent jobs', fr: 'Emplois récents' },
  saved_jobs: { en: 'Saved jobs', fr: 'Emplois enregistrés' },
  my_applications: { en: 'My applications', fr: 'Mes candidatures' },
  filters: { en: 'Filters', fr: 'Filtres' },
  clear_filters: { en: 'Clear filters', fr: 'Effacer les filtres' },
  qualification: { en: 'Qualification', fr: 'Qualification' },
  educational_level: { en: 'Educational level', fr: 'Niveau d’enseignement' },
  skills: { en: 'Skills', fr: 'Compétences' },
  employment_type: { en: 'Employment type', fr: 'Type d’emploi' },
  experience_required: { en: 'Experience required', fr: 'Expérience requise' },
  full_time: { en: 'Full-time', fr: 'Temps plein' },
  part_time: { en: 'Part-time', fr: 'Temps partiel' },
  contract: { en: 'Contract', fr: 'Contrat' },
  temporary: { en: 'Temporary', fr: 'Temporaire' },
  application_deadline: { en: 'Application deadline', fr: 'Date limite de candidature' },
  positions: { en: 'Positions', fr: 'Postes' },
  responsibilities: { en: 'Responsibilities', fr: 'Responsabilités' },
  apply: { en: 'Apply', fr: 'Postuler' },
  apply_confirm: { en: 'Submit this application using your FobsSMS professional profile?', fr: 'Envoyer cette candidature avec votre profil professionnel FobsSMS ?' },
  motivation: { en: 'Motivation message', fr: 'Message de motivation' },
  availability: { en: 'Expected availability', fr: 'Disponibilité prévue' },
  application_submitted: { en: 'Application submitted', fr: 'Candidature envoyée' },
  status_submitted: { en: 'Submitted', fr: 'Envoyée' },
  status_viewed: { en: 'Viewed', fr: 'Consultée' },
  status_accepted: { en: 'Accepted', fr: 'Acceptée' },
  status_rejected: { en: 'Rejected', fr: 'Refusée' },
  application_read_only: { en: 'This application can no longer be edited.', fr: 'Cette candidature ne peut plus être modifiée.' },
  already_applied: { en: 'You have already applied for this job.', fr: 'Vous avez déjà postulé à cette offre.' },
  no_jobs: { en: 'No jobs match these filters.', fr: 'Aucune offre ne correspond à ces filtres.' },
  social: { en: 'Social', fr: 'Réseau' },
  school: { en: 'School', fr: 'École' },
  mark_all_read: { en: 'Mark all as read', fr: 'Tout marquer comme lu' },
  no_notifications: { en: 'You are all caught up.', fr: 'Vous êtes à jour.' },
  global_search: { en: 'Search FobsSMS', fr: 'Rechercher sur FobsSMS' },
  teachers: { en: 'Teachers', fr: 'Enseignants' },
  // Short forms for segmented controls, where the full labels overflow.
  suggested: { en: 'Suggested', fr: 'Suggérés' },
  trending: { en: 'Trending', fr: 'Tendances' },
  forum: { en: 'Forum', fr: 'Forum' },
  download: { en: 'Download image', fr: "Télécharger l'image" },
  copy: { en: 'Copy', fr: 'Copier' },
  copied: { en: 'Copied to clipboard', fr: 'Copié dans le presse-papiers' },
  forward: { en: 'Forward', fr: 'Transférer' },
  forwarded: { en: 'Forwarded', fr: 'Transféré' },
  edit_message: { en: 'Edit', fr: 'Modifier' },
  delete_message: { en: 'Delete', fr: 'Supprimer' },
  delete_message_confirm: { en: 'Delete this message for everyone?', fr: 'Supprimer ce message pour tout le monde ?' },
  message_deleted: { en: 'This message was deleted', fr: 'Ce message a été supprimé' },
  replying_to: { en: 'Replying to', fr: 'Réponse à' },
  save_changes: { en: 'Save', fr: 'Enregistrer' },
  delete_chat: { en: 'Delete chat', fr: 'Supprimer la discussion' },
  delete_chat_confirm: { en: 'Delete this chat? It is removed only for you.', fr: 'Supprimer cette discussion ? Elle est retirée uniquement pour vous.' },
  forward_to: { en: 'Forward to', fr: 'Transférer à' },
  announcements: { en: 'Announcements', fr: 'Annonces' },
  posts: { en: 'Posts', fr: 'Publications' },
  recent_searches: { en: 'Recent searches', fr: 'Recherches récentes' },
  clear_search: { en: 'Clear search', fr: 'Effacer la recherche' },
  search_prompt: { en: 'Search teachers, professional posts and jobs.', fr: 'Recherchez des enseignants, publications et emplois.' },
  vote: { en: 'Vote', fr: 'Voter' },
  votes: { en: 'votes', fr: 'votes' },
  profile_posts: { en: 'My posts', fr: 'Mes publications' },
  my_reshares: { en: 'My reshares', fr: 'Mes republications' },
  account_settings: { en: 'Account settings', fr: 'Paramètres du compte' },
  return_social: { en: 'Return to social network', fr: 'Retourner au réseau social' },
  validation_required: { en: 'Complete the required fields.', fr: 'Complétez les champs obligatoires.' },
  operation_failed: { en: 'Something went wrong. Please try again.', fr: 'Une erreur est survenue. Veuillez réessayer.' },
  
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
