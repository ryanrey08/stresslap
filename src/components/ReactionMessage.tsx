import { MessageCircle } from "lucide-react";

export function ReactionMessage({ message, messageKey }: { message: string; messageKey: number }) {
  return (
    <section className="card flex items-center gap-4 p-5" aria-live="polite" aria-label="Reaction message">
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-purple-900 shadow-lg">
        <MessageCircle className="size-6" />
      </div>
      <p key={messageKey} className="anim-pop font-display text-2xl leading-tight tracking-wide sm:text-3xl" data-testid="reaction-message">
        {message}
      </p>
    </section>
  );
}
