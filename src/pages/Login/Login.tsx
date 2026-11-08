import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type LoginFormData = {
  email: string;
  senha: string;
};

export default function Login() {
  const [mensagem, setMensagem] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setMensagem('');
    try {
      await signIn(data.email, data.senha);
      navigate('/dashboard', { replace: true });
    } catch {
      setMensagem('E-mail ou senha inválidos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-forest-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl md:p-10">
        <Link
          to="/"
          className="flex justify-center font-ultra text-3xl text-forest-950"
        >
          <span className="relative z-10">Equilibra</span>
          <span className="relative z-0 -ml-2 top-2 text-forest-700">Fin</span>
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-forest-950">
          Bem-vindo de volta!
        </h1>

        <p className="mt-2 text-forest-800">
          Entre na sua conta para continuar.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
          noValidate
        >
          {/* E-mail */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-forest-950"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              aria-invalid={!!errors.email}
              {...register('email', {
                required: 'Informe seu e-mail.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Informe um e-mail válido.',
                },
              })}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-forest-500 ${
                errors.email
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-forest-600'
              }`}
            />

            {errors.email?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-semibold text-forest-950"
            >
              Senha
            </label>

            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              aria-invalid={!!errors.senha}
              {...register('senha', {
                required: 'Informe sua senha.',
                minLength: {
                  value: 6,
                  message: 'A senha deve ter pelo menos 6 caracteres.',
                },
              })}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-forest-500 ${
                errors.senha
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-forest-600'
              }`}
            />

            {errors.senha?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.senha.message}
              </p>
            )}
          </div>

          {/* Botão de login */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-xl bg-[#FBFE34] px-6 py-4 font-bold text-forest-950 shadow-md transition duration-300 hover:scale-[1.02] hover:bg-[#E8EB20] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Entrar →
          </button>

          {mensagem && (
            <p className="text-center text-sm text-forest-800" role="status">
              {mensagem}
            </p>
          )}
        </form>

        {/* Cadastro */}
        <p className="mt-8 text-center text-sm text-forest-800">
          Ainda não tem cadastro?{' '}
          <Link
            to="/cadastro"
            className="font-semibold underline underline-offset-4 hover:text-forest-600"
          >
            Criar minha conta
          </Link>
        </p>

        {/* Voltar para o início */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-forest-700 hover:text-forest-950"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
