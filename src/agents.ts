import { Bot, Terminal, Palette } from 'lucide-react';

export const AGENTS = [
  { 
    id: 'general', 
    name: 'Nova AI Core', 
    icon: Bot,
    description: 'Data-sovereign advising engine for strategy and general task planning.' 
  },
  { 
    id: 'devops', 
    name: 'Code Copilot', 
    icon: Terminal,
    description: 'Builds tailored web applications, sets up CI/CD pipelines, and generates code.' 
  },
  { 
    id: 'design', 
    name: 'Creative UI/UX', 
    icon: Palette,
    description: 'Generates UI/UX concepts, slide deck structures, and design strategies.' 
  }
];

