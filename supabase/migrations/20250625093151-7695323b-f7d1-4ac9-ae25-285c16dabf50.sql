
-- Create enum types for various statuses and categories
CREATE TYPE project_status AS ENUM ('active', 'on_hold', 'completed');
CREATE TYPE lock_type AS ENUM ('hard', 'soft');
CREATE TYPE urgency_level AS ENUM ('normal', 'medium', 'urgent');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  date_of_joining DATE NOT NULL,
  profile_picture_url TEXT,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  department_id UUID REFERENCES public.departments(id),
  reporting_manager_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status project_status NOT NULL DEFAULT 'active',
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project assignments table (many-to-many between projects and employees)
CREATE TABLE public.project_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  lock_type lock_type NOT NULL DEFAULT 'soft',
  utilization_percentage INTEGER DEFAULT 100 CHECK (utilization_percentage > 0 AND utilization_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, employee_id, role_id)
);

-- Create hiring requirements table
CREATE TABLE public.hiring_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_name TEXT NOT NULL,
  number_of_openings INTEGER NOT NULL DEFAULT 1 CHECK (number_of_openings > 0),
  urgency urgency_level NOT NULL DEFAULT 'normal',
  experience_required TEXT NOT NULL,
  job_description TEXT,
  job_document_url TEXT,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage departments" ON public.departments FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage employees" ON public.employees FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage projects" ON public.projects FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage roles" ON public.roles FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view project assignments" ON public.project_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage project assignments" ON public.project_assignments FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view hiring requirements" ON public.hiring_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage hiring requirements" ON public.hiring_requirements FOR ALL TO authenticated USING (true);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  RETURN new;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert some initial data
INSERT INTO public.departments (name, description) VALUES 
('Engineering', 'Software development and technical teams'),
('Design', 'UI/UX and product design teams'),
('Product', 'Product management and strategy'),
('Marketing', 'Marketing and growth teams'),
('Sales', 'Sales and business development');

INSERT INTO public.roles (name, description) VALUES 
('Frontend Developer', 'Develops user interfaces and client-side applications'),
('Backend Developer', 'Develops server-side applications and APIs'),
('Full Stack Developer', 'Develops both frontend and backend applications'),
('Data Engineer', 'Builds and maintains data infrastructure'),
('DevOps Engineer', 'Manages deployment and infrastructure'),
('UI/UX Designer', 'Designs user interfaces and experiences'),
('Product Manager', 'Manages product strategy and roadmap'),
('Project Manager', 'Manages project timelines and resources');
