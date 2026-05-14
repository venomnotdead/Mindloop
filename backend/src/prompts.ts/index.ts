import { financeTutorPrompt } from "./finance.js";
import { languageTutorPrompt } from "./language.js";
import { lawTutorPrompt } from "./law.js";

type TutorConfig = {
  type: string;
  level?: string;
  goal?: string;
};

export const buildSystemPrompt = ({
  type,
  level = "beginner",
  goal = "",
}: TutorConfig) => {
  switch (type) {
    case "human_language":
      return languageTutorPrompt(level, goal);

    case "finance":
      return financeTutorPrompt(level);

    case "law":
      return lawTutorPrompt(level);

    default:
      return defaultPrompt();
  }
};

const defaultPrompt = () => {
  return "hi";
};
