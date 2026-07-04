import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";

// ponytail: Effect v4 beta has no Schema.Email; isPattern keeps bad-email → 400.
const Email = Schema.String.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));

export const SignUpRequest = Schema.Struct({
  email: Email,
  password: Schema.String.check(Schema.isMinLength(8)),
}).annotate({
  identifier: "SignUpRequest",
  description: "Email + password sign-up payload",
});

export const SignUpResponse = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
}).annotate({
  identifier: "SignUpResponse",
  description: "Created user identity (no password hash)",
});

export const AuthGroup = HttpApiGroup.make("Auth").add(
  HttpApiEndpoint.post("signup", "/signup", {
    payload: SignUpRequest,
    success: SignUpResponse.pipe(HttpApiSchema.status(201)),
    error: HttpApiError.Conflict,
  }).annotateMerge(
    OpenApi.annotations({
      summary: "Sign up with email and password",
    }),
  ),
);
