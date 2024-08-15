import { SelectableWord } from '@/types/word';
import { useFormStatus } from 'react-dom';

type WordSelectProps = {
  word: SelectableWord;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onSelect: (word: SelectableWord) => void;
};

export default function WordSelect({
  word,
  inputRef,
  onSelect,
}: WordSelectProps) {
  const handleClick = () => {
    onSelect(word);
  };

  return (
    <>
      <input
        id={word.id}
        ref={inputRef}
        type="submit"
        className="text-xl border border-muted-foreground rounded-md px-4 py-2 m-2 cursor-pointer hover:bg-muted transition-colors duration-150"
        value={word.word}
        name="word"
        onClick={handleClick}
      />
    </>
  );
}
