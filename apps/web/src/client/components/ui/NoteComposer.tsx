import React, { useMemo, useRef, useState } from 'react';
import { useErp } from '../../contexts/ErpContext';
import { textareaClass } from '../../utils/styles';
import { Avatar } from './Avatar';
import { Button } from './Button';

interface NoteComposerProps {
  onPost: (body: string) => boolean;
  placeholder?: string;
}

export function NoteComposer({ onPost, placeholder = 'Add an internal note… Use @ to mention a teammate' }: NoteComposerProps) {
  const { state, user } = useErp();
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const mentionQuery = useMemo(() => {
    const match = /@(\w*)$/.exec(body);
    return match ? match[1].toLowerCase() : null;
  }, [body]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return state.users.filter((u) => u.kind === 'person' && u.id !== user.id && u.name.toLowerCase().startsWith(mentionQuery)).slice(0, 5);
  }, [mentionQuery, state.users, user.id]);

  const insertMention = (name: string) => {
    setBody((prev) => prev.replace(/@(\w*)$/, `@${name.split(' ')[0]} `));
    ref.current?.focus();
  };

  const submit = () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    const ok = onPost(body);
    setPosting(false);
    if (ok) setBody('');
  };

  return (
    <div className="flex gap-3">
      <Avatar initials={user.initials} />
      <div className="relative min-w-0 flex-1">
        <label htmlFor="note-composer" className="sr-only">
          Internal note
        </label>
        <textarea
          id="note-composer"
          ref={ref}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className={textareaClass} />
        
        {suggestions.length > 0 &&
        <div className="absolute left-0 top-full z-20 mt-1 w-60 rounded-lg border border-line bg-surface p-1 shadow-pop" role="listbox" aria-label="Mention a teammate">
            {suggestions.map((u) =>
          <button
            key={u.id}
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => insertMention(u.name)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-surface-2">
            
                <Avatar initials={u.initials} size="sm" />
                <span className="min-w-0 flex-1 truncate">{u.name}</span>
                <span className="truncate text-xs text-subtle">{u.title}</span>
              </button>
          )}
          </div>
        }
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-subtle">Only visible to your team · ⌘↵ to post</span>
          <Button size="sm" variant="primary" onClick={submit} disabled={!body.trim()} loading={posting}>
            Post note
          </Button>
        </div>
      </div>
    </div>);

}