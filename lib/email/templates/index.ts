import { newMatchTemplate } from "./new-match"
import { welcomeTemplate } from "./welcome"
import { passwordResetTemplate } from "./password-reset"
import { milestoneUpdateTemplate } from "./milestone-update"
import { meetingConfirmationTemplate } from "./meeting-confirmation"
import { startupApprovedTemplate } from "./startup-approved"
import { startupRejectedTemplate } from "./startup-rejected"
import { profileChangesSubmittedTemplate } from "./profile-changes-submitted"
import { systemTemplate } from "./system"

export type EmailTemplate = (data: Record<string, any>) => string

export const templates = {
  "new-match": newMatchTemplate,
  welcome: welcomeTemplate,
  "password-reset": passwordResetTemplate,
  "milestone-update": milestoneUpdateTemplate,
  "meeting-confirmation": meetingConfirmationTemplate,
  "startup-approved": startupApprovedTemplate,
  "startup-rejected": startupRejectedTemplate,
  "profile-changes-submitted": profileChangesSubmittedTemplate,
  system: systemTemplate,
}

export {
  newMatchTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  milestoneUpdateTemplate,
  meetingConfirmationTemplate,
  startupApprovedTemplate,
  startupRejectedTemplate,
  profileChangesSubmittedTemplate,
  systemTemplate,
}
