import { newMatchTemplate } from "./new-match"
import { welcomeTemplate } from "./welcome"
import { passwordResetTemplate } from "./password-reset"
import { milestoneUpdateTemplate } from "./milestone-update"
import { meetingConfirmationTemplate } from "./meeting-confirmation"

export type EmailTemplate = (data: Record<string, any>) => string

export const templates = {
  "new-match": newMatchTemplate,
  welcome: welcomeTemplate,
  "password-reset": passwordResetTemplate,
  "milestone-update": milestoneUpdateTemplate,
  "meeting-confirmation": meetingConfirmationTemplate,
}

export {
  newMatchTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  milestoneUpdateTemplate,
  meetingConfirmationTemplate,
}
