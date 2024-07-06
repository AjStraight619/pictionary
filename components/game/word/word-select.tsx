import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type WordSelect = {
  word: string;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  pending?: boolean;
};

export default function WordSelect({ word, inputRef, pending }: WordSelect) {
  return (
    <>
      {pending && <Loader2 className="animate-spin" />}
      <input
        disabled={pending}
        ref={inputRef}
        type="submit"
        className="text-xl border border-muted-foreground rounded-md px-4 py-2 m-2 cursor-pointer hover:bg-muted"
        value={word}
        name="word"
      />
    </>
  );
}
