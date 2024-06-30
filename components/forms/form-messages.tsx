type FormMessageProps = {
  message: string;
};
export function ErrorMessage({ message }: FormMessageProps) {
  return (
    <div className="p-2 rounded-md bg-destructive/30 ">
      <p className="text-destructive text-center">{message}</p>
    </div>
  );
}

export function SuccessMessage({ message }: FormMessageProps) {
  return (
    <div className="p-2 rounded-md bg-emerald-600/30">
      <p className="text-emerald-600 text-center">{message}</p>
    </div>
  );
}
