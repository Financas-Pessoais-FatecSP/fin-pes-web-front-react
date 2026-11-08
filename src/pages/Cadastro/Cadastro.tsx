import { useState } from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type CadastroFormData = {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

export default function Cadastro() {
  const [mensagem, setMensagem] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormData>();

  const onSubmit: SubmitHandler<CadastroFormData> = async (data) => {
    setMensagem('');
    try {
      await signUp({
        name: data.nome.trim(),
        surname: data.sobrenome.trim(),
        email: data.email,
        password: data.senha,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a conta. Verifique os dados e tente novamente.',
      );
    }
  };

  const senha = useWatch({
    control,
    name: 'senha',
  });

  return (
    <div className="min-h-screen bg-forest-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl md:p-10">
        {/* Logo */}
        <Link
          to="/"
          className="flex justify-center font-ultra text-3xl text-forest-950"
        >
          <span className="relative z-10">Equilibra</span>
          <span className="relative z-0 -ml-2 top-2 text-forest-700">Fin</span>
        </Link>

        {/* Título */}
        <h1 className="mt-8 text-3xl font-bold text-forest-950">
          Crie sua conta!
        </h1>

        <p className="mt-2 text-forest-800">
          Comece a cuidar melhor das suas finanças.
        </p>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
          noValidate
        >
          {/* Nome completo */}
          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-semibold text-forest-950"
            >
              Nome completo
            </label>

            <input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder="Digite seu nome completo"
              aria-invalid={!!errors.nome}
              {...register('nome', {
                required: 'Informe seu nome completo.',
                minLength: {
                  value: 3,
                  message: 'Digite pelo menos 3 caracteres.',
                },
              })}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-forest-500 ${
                errors.nome
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-forest-600'
              }`}
            />

            {errors.nome?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.nome.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sobrenome"
              className="mb-2 block text-sm font-semibold text-forest-950"
            >
              Sobrenome
            </label>
            <input
              id="sobrenome"
              type="text"
              autoComplete="family-name"
              placeholder="Digite seu sobrenome"
              aria-invalid={!!errors.sobrenome}
              {...register('sobrenome', {
                required: 'Informe seu sobrenome.',
                minLength: { value: 2, message: 'Digite pelo menos 2 caracteres.' },
              })}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-forest-500 ${
                errors.sobrenome
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-forest-600'
              }`}
            />
            {errors.sobrenome?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.sobrenome.message}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
              placeholder="Crie uma senha"
              aria-invalid={!!errors.senha}
              {...register('senha', {
                required: 'Crie uma senha.',
                minLength: {
                  value: 8,
                  message: 'A senha deve ter pelo menos 8 caracteres.',
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

          {/* Confirmar senha */}
          <div>
            <label
              htmlFor="confirmarSenha"
              className="mb-2 block text-sm font-semibold text-forest-950"
            >
              Confirmar senha
            </label>

            <input
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              aria-invalid={!!errors.confirmarSenha}
              {...register('confirmarSenha', {
                required: 'Confirme sua senha.',
                validate: (valor) =>
                  valor === senha || 'As senhas não coincidem.',
              })}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-forest-500 ${
                errors.confirmarSenha
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-forest-600'
              }`}
            />

            {errors.confirmarSenha?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.confirmarSenha.message}
              </p>
            )}
          </div>

          {/* Botão de cadastro */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-xl bg-[#FBFE34] px-6 py-4 font-bold text-forest-950 shadow-md transition duration-300 hover:scale-[1.02] hover:bg-[#E8EB20] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Criar minha conta →
          </button>

          {mensagem && (
            <p className="text-center text-sm text-forest-800" role="status">
              {mensagem}
            </p>
          )}
        </form>

        {/* Link para login */}
        <p className="mt-8 text-center text-sm text-forest-800">
          Já tem cadastro?{' '}
          <Link
            to="/login"
            className="font-semibold underline underline-offset-4 hover:text-forest-600"
          >
            Entre na sua conta
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
