/**
 * FieldInput — Champ de saisie avec :
 *   - Étoile rouge sur les champs obligatoires (disparaît quand rempli)
 *   - Bordure verte si valide, rouge si erreur
 *   - Message d'erreur inline
 */

const FieldInput = ({
  label,
  required = false,
  value = '',
  onChange,
  error = null,
  type = 'text',
  placeholder = '',
  as = 'input',   // 'input' | 'textarea' | 'select'
  rows = 3,
  children,       // pour les <option> du select
  className = '',
  inputClassName = '',
  ...rest
}) => {
  const isFilled = value !== '' && value !== null && value !== undefined && String(value).trim() !== '';
  const showStar = required && !isFilled;
  const showValid = required && isFilled && !error;

  const baseInput = `w-full px-5 py-3.5 rounded-2xl border text-sm font-bold dark:text-white transition-all focus:outline-none focus:ring-2 ${
    error
      ? 'border-red-400 bg-red-50/50 dark:bg-red-500/5 focus:ring-red-400 focus:border-red-400'
      : showValid
        ? 'border-dakora-green/40 bg-dakora-green/5 dark:bg-dakora-green/5 focus:ring-dakora-green'
        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:ring-dakora-green focus:border-dakora-green'
  }`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* LABEL + ÉTOILE */}
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label}
        {showStar && (
          <span className="text-red-500 text-xs leading-none" aria-label="obligatoire">★</span>
        )}
        {showValid && (
          <span className="text-dakora-green text-xs leading-none">✓</span>
        )}
      </label>

      {/* CHAMP */}
      {as === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={`${baseInput} resize-none ${inputClassName}`}
          {...rest}
        />
      ) : as === 'select' ? (
        <select
          value={value}
          onChange={onChange}
          className={`${baseInput} cursor-pointer ${inputClassName}`}
          {...rest}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${baseInput} ${inputClassName}`}
          {...rest}
        />
      )}

      {/* ERREUR */}
      {error && (
        <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1 animate-in slide-in-from-top-1 duration-150">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default FieldInput;
