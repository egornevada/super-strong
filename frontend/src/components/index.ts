// Header components
export { Header } from './headers/HeaderCalendar';
export type { HeaderProps } from './headers/HeaderCalendar';

export { HeaderWithBackButton } from './headers/HeaderExercise';
export type { HeaderWithBackButtonProps } from './headers/HeaderExercise';

// Main components
export { Button } from './main-components/Button';
export type { ButtonProps } from './main-components/Button';
export { FilterPill } from './main-components/FilterPill';
export type { FilterPillProps } from './main-components/FilterPill';
export { StickyTagsBar } from './main-components/StickyTagsBar';
export type { StickyTagsBarProps } from './main-components/StickyTagsBar';
export { TextField } from './main-components/TextField';
export type { TextFieldProps } from './main-components/TextField';
export { DefaultStroke } from './main-components/MonthStats';
export type { DefaultStrokeProps } from './main-components/MonthStats';

// Calendar components
export { Calendar } from './calendar/Calendar';
export type { CalendarProps } from './calendar/Calendar';

// Widgets
export { ExerciseCard } from './widgets/ExerciseCard';
export type { ExerciseCardProps } from './widgets/ExerciseCard';
export { TrackCard } from './widgets/TrackCard';
export type { TrackCardProps, Set } from './widgets/TrackCard';
export { WorkoutCard } from './widgets/WorkoutCard';
export type { WorkoutCardProps, WorkoutSession } from './widgets/WorkoutCard';

// Modals
export { SetModal } from './modals/SetModal';
export type { SetModalProps } from './modals/SetModal';
export { UsernameModal } from './modals/UsernameModal';
export type { UsernameModalProps } from './modals/UsernameModal';
export { AlertDialog } from './modals/AlertDialog';
export type { AlertDialogProps } from './modals/AlertDialog';
export { ModalBig } from './modals/ModalBig';
export type { ModalBigProps } from './modals/ModalBig';

// Error page (deprecated - rarely used)
export { ErrorPage } from './deprecated/ErrorPage';
export type { ErrorPageProps } from './deprecated/ErrorPage';

// Sheet components
export { SheetOverlay } from './modals/SheetOverlay';

// Loading components (LoadingScreen moved to pages/StartAppLoading.tsx)
export { LoadingScreenSkeleton } from './loading/LoadingScreenSkeleton';
export { Loader, InlineLoader } from './loading/Loader';
export type { LoaderProps } from './loading/Loader';
export { HeaderLoader } from './loading/HeaderLoader';
export type { HeaderLoaderProps } from './loading/HeaderLoader';
export { ExercisesPageSkeleton } from './loading/ExercisesPageSkeleton';

// Dots Slider (formerly Steps Slider)
export { DotsSlider } from './main-components/DotsSlider/DotsSlider';
export type { DotsSliderProps } from './main-components/DotsSlider/DotsSlider';

// Deprecated components (still exported for backwards compatibility)
export { Snackbar } from './deprecated/Snackbar';
export type { SnackbarProps } from './deprecated/Snackbar';
