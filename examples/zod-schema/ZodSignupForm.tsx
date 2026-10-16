import { z } from "zod";
import { useForm } from "../../src";
import { zodResolver } from "../../src/resolvers/zod";

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8)
});

type SignupValues = z.infer<typeof signupSchema>;

export function ZodSignupForm() {
  const form = useForm<SignupValues>({
    mode: "onBlur",
    resolver: zodResolver(signupSchema)
  });

  return (
    <form onSubmit={form.handleSubmit((values) => console.log(values))}>
      <input {...form.register("name")} placeholder="Name" />
      <span>{form.errors.name?.message}</span>

      <input {...form.register("email")} placeholder="Email" />
      <span>{form.errors.email?.message}</span>

      <input {...form.register("password")} placeholder="Password" type="password" />
      <span>{form.errors.password?.message}</span>

      <button type="submit">Create account</button>
    </form>
  );
}
