"use server";
// TODO: Check to see if the guess matches what is in the db
// TODO: We will use this to then update the persons score..

export async function checkGuess(formData: FormData) {
  const guess = formData.get("guess");

  console.log("guess: ", guess);
}
