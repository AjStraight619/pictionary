import { useWord } from "@/context/word-provider";
import { motion, AnimatePresence } from "framer-motion";
export default function Round() {
  const { word } = useWord();
  return <motion.div className="w-full"></motion.div>;
}
