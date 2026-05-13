import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, "../../skills");

const WRAPPERS = {
  brainstorm: {
    description: "Turn an idea into an approved spec",
    template:
      "Use the `brainstorm` skill to handle the following request:\n\n$ARGUMENTS\n",
  },
  "plan-universal": {
    description: "Turn an approved spec into an executable implementation plan",
    template:
      "Use the `plan-universal` skill to handle the following request:\n\n$ARGUMENTS\n",
  },
  "handoff-plan": {
    description:
      "Generate a paste-ready handoff message for another LLM agent to execute the plan",
    template:
      "Use the `handoff-plan` skill to handle the following request:\n\n$ARGUMENTS\n",
  },
};

export const TuncssPlanKitPlugin = async () => ({
  config: async (config) => {
    config.skills = config.skills || {};
    config.skills.paths = config.skills.paths || [];
    if (!config.skills.paths.includes(skillsDir)) {
      config.skills.paths.push(skillsDir);
    }
    config.command = config.command || {};
    for (const [name, def] of Object.entries(WRAPPERS)) {
      if (!config.command[name]) {
        config.command[name] = {
          template: def.template,
          description: def.description,
        };
      }
    }
  },
});
