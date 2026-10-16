import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFieldArray, useForm } from "../src";

interface Values {
  phones: Array<{ number: string }>;
}

function PhoneForm() {
  const form = useForm<Values>({
    defaultValues: { phones: [{ number: "111" }, { number: "222" }, { number: "333" }] }
  });
  const phones = useFieldArray<Values, { number: string }>({ control: form.control, name: "phones" });

  return (
    <form>
      {phones.fields.map((field, index) => (
        <input
          aria-label={`phone-${index}`}
          key={field.id}
          {...form.register(`phones.${index}.number`)}
        />
      ))}
      <button onClick={() => phones.remove(1)} type="button">remove middle</button>
    </form>
  );
}

describe("field array stable keys", () => {
  it("preserves values around removed fields", async () => {
    render(<PhoneForm />);
    fireEvent.change(screen.getByLabelText("phone-2"), { target: { value: "999" } });
    fireEvent.click(screen.getByText("remove middle"));

    await waitFor(() => {
      expect((screen.getByLabelText("phone-0") as HTMLInputElement).value).toBe("111");
      expect((screen.getByLabelText("phone-1") as HTMLInputElement).value).toBe("999");
    });
  });
});
