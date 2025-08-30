export interface UserCreationState {
  step: number;
  progress: number;
  message: string;
  isLoading?: boolean;
  error?: string | null;
}

export interface UserCreationStateInterface extends UserCreationState {
  // Additional properties can be added here if needed
}