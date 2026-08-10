export function validateEmail(email: string): boolean {
  if (!email) return true; // Optional field validator
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateTitle(title: string): { valid: boolean; error?: string } {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Title is required.' };
  }
  if (title.length < 3) {
    return { valid: false, error: 'Title must be at least 3 characters long.' };
  }
  if (title.length > 250) {
    return { valid: false, error: 'Title cannot exceed 250 characters.' };
  }
  return { valid: true };
}

export function validateDescription(description: string): { valid: boolean; error?: string } {
  if (!description || !description.trim()) {
    return { valid: false, error: 'Description is required.' };
  }
  return { valid: true };
}
