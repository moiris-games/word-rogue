/**
 * The engine's public contract (ENG-002, ENG-003).
 *
 * Nothing in this folder may import a framework or a Node built-in (TEC-007):
 * the same modules run in the app under Hermes, in tools/ under Node, and in
 * the verification worker on the server (LB-032).
 */

/** An exact rational. W and F are carried like this through SCR-001 steps 1-7. */
export interface Rational {
  readonly num: number;
  readonly den: number;
}

export type StructureId = `S${number}`;
export type ToneId = string;
export type ErrorCodeId = string;

export interface Token {
  readonly kind: "card" | "tile";
  /** Stable data id (DATA-003) — never an array index. */
  readonly id: string;
  /** Which inflected form the Form Wheel is showing. */
  readonly form: string;
}

export interface EngineInput {
  readonly tokens: readonly Token[];
  readonly chapter: 1 | 2 | 3 | 4;
  readonly unlockedStructures: readonly StructureId[];
  readonly unlockedTones: readonly ToneId[];
  readonly unlockedForms: readonly string[];
  readonly structureLevels: Readonly<Record<StructureId, number>>;
}

/** One step of SCR-001, as the animation replays it (SCR-050, SCR-053). */
export interface TraceStep {
  readonly step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly weightBefore: Rational;
  readonly forceBefore: Rational;
  readonly weightAfter: Rational;
  readonly forceAfter: Rational;
  readonly reason: string;
  /** Card, seal or constraint id responsible, when there is one. */
  readonly sourceId: string | null;
}

export interface Analysis {
  readonly structure: StructureId | null;
  readonly tone: ToneId | null;
  readonly valid: boolean;
  readonly meaningful: boolean;
  /** Grammatical but semantically odd — scores, loses the +1 F (ENG-031). */
  readonly poetic: boolean;
  /** Ungrammatical commit: raw card weights only (SCR-030). */
  readonly mumble: boolean;
  readonly errorCode: ErrorCodeId | null;
  readonly errorTokenIndex: number | null;
  readonly score: number;
  readonly trace: readonly TraceStep[];
}
