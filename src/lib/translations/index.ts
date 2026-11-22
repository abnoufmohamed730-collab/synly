import type { Lang, TranslationDict, TranslationModule } from "./types";
import common from "./common";
import welcome from "./welcome";
import auth from "./auth";
import map from "./map";
import user from "./user";
import vendor from "./vendor";
import profile from "./profile";
import operations from "./operations";

const modules: TranslationModule[] = [common, welcome, auth, map, user, vendor, profile, operations];

function mergeModules(modules: TranslationModule[]): Record<Lang, TranslationDict> {
  return modules.reduce(
    (acc, module) => ({
      en: { ...acc.en, ...module.en },
      ar: { ...acc.ar, ...module.ar },
    }),
    { en: {}, ar: {} } as Record<Lang, TranslationDict>
  );
}

export const translations = mergeModules(modules);

export type { Lang, TranslationDict, TranslationModule };
