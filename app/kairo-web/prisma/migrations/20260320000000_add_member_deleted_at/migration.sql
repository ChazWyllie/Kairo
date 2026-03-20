-- Add deletedAt column to Member for GDPR data deletion support.
-- When a member requests erasure, PII fields are nulled and this timestamp is set.
-- Financial fields (email, stripeCustomerId, stripeSubId, planTier, status) are preserved
-- for 7-year financial compliance per GDPR Art. 17(3)(b).

ALTER TABLE "Member" ADD COLUMN "deletedAt" TIMESTAMP(3);
