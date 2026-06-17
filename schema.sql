-- EcoMind AI Database Schema Setup

-- Create Users Table (extends Supabase Auth users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Assessments Table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  transport_score NUMERIC NOT NULL,
  food_score NUMERIC NOT NULL,
  energy_score NUMERIC NOT NULL,
  shopping_score NUMERIC NOT NULL,
  total_score NUMERIC NOT NULL, -- 0-100 sustainability score (higher is better)
  annual_emissions NUMERIC NOT NULL, -- annual CO2 emissions in metric tons (tCO2e)
  answers JSONB NOT NULL, -- raw assessment responses for AI analysis
  ai_analysis JSONB, -- cached gemini response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create Security Policies
CREATE POLICY "Users can view and update their own profile" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own assessments" ON public.assessments
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger to automatically create a public.users row on auth.signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Eco User'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
