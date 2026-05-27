/**
 * Maps API auth error strings (English) to localized messages.
 */
export const translateAuthError = (err, t) => {
  if (!err || typeof err !== "string") {
    return t("auth.messages.something_wrong");
  }

  const trimmed = err.trim();

  const errorMap = {
    "Username is already in use.": t("auth.messages.username_taken"),
    "Username already exists.": t("auth.messages.username_taken"),
    "Email is already in use.": t("auth.messages.email_taken"),
    "Email already exists.": t("auth.messages.email_taken"),
    "Password is wrong.": t("auth.validation.password_wrong"),
    "User not found.": t("auth.validation.user_not_found"),
    "Invalid username or password.": t("auth.validation.invalid_credentials"),
    "Account is locked.": t("auth.validation.account_locked"),
    "Email not confirmed.": t("auth.validation.email_not_confirmed"),
    "Passwords must have at least one non alphanumeric character.": t("auth.validation.password_non_alphanumeric"),
    "Passwords must have at least one uppercase ('A'-'Z').": t("auth.validation.password_uppercase"),
    "Passwords must have at least one lowercase ('a'-'z').": t("auth.validation.password_lowercase"),
    "Passwords must have at least one digit ('0'-'9').": t("auth.validation.password_digit"),
    "Passwords must be at least 8 characters.": t("auth.validation.password_min_length"),
    "Passwords must have at least one special character.": t("auth.validation.password_non_alphanumeric"),
    "Passwords do not match.": t("auth.messages.passwords_dont_match"),
    "Invalid email address.": t("auth.validation.invalid_email"),
    "Something went wrong. Please try again.": t("auth.messages.something_wrong"),
  };

  if (errorMap[trimmed]) {
    return errorMap[trimmed];
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("email") && (lower.includes("already exists") || lower.includes("already in use"))) {
    return t("auth.messages.email_taken");
  }
  if (lower.includes("username") && (lower.includes("already exists") || lower.includes("already in use"))) {
    return t("auth.messages.username_taken");
  }
  if (lower.includes("password") && lower.includes("do not match")) {
    return t("auth.messages.passwords_dont_match");
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return t("auth.validation.invalid_email");
  }
  if (lower.includes("password") && lower.includes("wrong")) {
    return t("auth.validation.password_wrong");
  }
  if (lower.includes("user not found")) {
    return t("auth.validation.user_not_found");
  }
  if (lower.includes("invalid") && (lower.includes("username") || lower.includes("password"))) {
    return t("auth.validation.invalid_credentials");
  }
  if (lower.includes("email") && lower.includes("not confirmed")) {
    return t("auth.validation.email_not_confirmed");
  }
  if (lower.includes("account") && lower.includes("locked")) {
    return t("auth.validation.account_locked");
  }
  if (lower.includes("non alphanumeric") || lower.includes("special character")) {
    return t("auth.validation.password_non_alphanumeric");
  }
  if (lower.includes("uppercase")) {
    return t("auth.validation.password_uppercase");
  }
  if (lower.includes("lowercase")) {
    return t("auth.validation.password_lowercase");
  }
  if (lower.includes("digit") || lower.includes("'0'-'9'")) {
    return t("auth.validation.password_digit");
  }
  if (lower.includes("at least 8")) {
    return t("auth.validation.password_min_length");
  }
  if (lower.includes("invalid") && lower.includes("otp")) {
    return t("auth.messages.invalid_otp");
  }

  return trimmed;
};

export const translateAuthErrors = (errors, t) => {
  if (!errors?.length) return [];
  return errors.map((err) => translateAuthError(err, t));
};
