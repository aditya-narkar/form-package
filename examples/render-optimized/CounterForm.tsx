import { memo, useRef } from "react";
import { useForm, useWatch } from "../../src";

interface Values {
  bio: string;
  email: string;
}

function RenderCount({ label }: { label: string }) {
  const count = useRef(0);
  count.current += 1;
  return <small>{label}: {count.current}</small>;
}

const EmailField = memo(function EmailField({ register }: Pick<ReturnType<typeof useForm<Values>>, "register">) {
  return (
    <label>
      Email
      <input {...register("email")} />
      <RenderCount label="email renders" />
    </label>
  );
});

function BioCounter({ control }: Pick<ReturnType<typeof useForm<Values>>, "control">) {
  const bio = useWatch({ control, name: "bio" }) ?? "";
  return <output>{280 - bio.length}</output>;
}

export function CounterForm() {
  const form = useForm<Values>({ defaultValues: { bio: "", email: "" }, mode: "onChange" });

  return (
    <form>
      <EmailField register={form.register} />
      <label>
        Bio
        <textarea {...form.register("bio")} />
      </label>
      <BioCounter control={form.control} />
    </form>
  );
}
