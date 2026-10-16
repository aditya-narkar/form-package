import { useForm } from "../../src";

interface SignupValues {
  email: string;
  name: string;
  password: string;
}

export function SignupForm() {
  const form = useForm<SignupValues>({ mode: "onSubmit" });

  return (
    <form onSubmit={form.handleSubmit((values) => console.log(values))}>
      <input {...form.register("name", { required: "Name is required" })} placeholder="Name" />
      <span>{form.errors.name?.message}</span>

      <input {...form.register("email", { required: "Email is required" })} placeholder="Email" />
      <span>{form.errors.email?.message}</span>

      <input {...form.register("password", { required: "Password is required" })} placeholder="Password" type="password" />
      <span>{form.errors.password?.message}</span>

      <button type="submit">Create account</button>
    </form>
  );
}
