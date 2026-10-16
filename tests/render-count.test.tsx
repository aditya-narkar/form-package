import { act, fireEvent, render, screen } from "@testing-library/react";
import { memo, useRef } from "react";
import { describe, expect, it } from "vitest";
import { useForm, useWatch } from "../src";

interface Values {
  first: string;
  second: string;
}

const SecondField = memo(function SecondField({ register }: Pick<ReturnType<typeof useForm<Values>>, "register">) {
  const renders = useRef(0);
  renders.current += 1;
  return (
    <>
      <input aria-label="second" {...register("second")} />
      <output aria-label="second-renders">{renders.current}</output>
    </>
  );
});

function FirstWatcher({ control }: Pick<ReturnType<typeof useForm<Values>>, "control">) {
  const first = useWatch({ control, name: "first" }) ?? "";
  return <output aria-label="first-value">{first}</output>;
}

function Form() {
  const form = useForm<Values>({ defaultValues: { first: "", second: "" }, mode: "onChange" });
  return (
    <form>
      <input aria-label="first" {...form.register("first")} />
      <FirstWatcher control={form.control} />
      <SecondField register={form.register} />
    </form>
  );
}

describe("render optimization", () => {
  it("typing in one field does not re-render an unrelated memoized field", async () => {
    render(<Form />);
    expect(screen.getByLabelText("second-renders").textContent).toBe("1");

    await act(async () => {
      fireEvent.change(screen.getByLabelText("first"), { target: { value: "hello" } });
    });

    expect(screen.getByLabelText("first-value").textContent).toBe("hello");
    expect(screen.getByLabelText("second-renders").textContent).toBe("1");
  });
});
