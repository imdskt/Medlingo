# Medlingo Architecture

## System Diagram

```mermaid
graph TD
    subgraph User Interface
        Upload["Upload PDF / Paste Text"]
        Results["Results Dashboard"]
        Print["Print Summary"]
    end

    subgraph API Layer
        Analyze["/api/analyze"]
        Health["/api/health"]
    end

    subgraph Processing
        PDFParse["pdf-parse Text Extraction"]
        Qwen["Qwen Cloud API<br/>qwen-plus"]
    end

    subgraph Alibaba Cloud
        Docker["Docker Container"]
        ECS["Alibaba Cloud ECS"]
    end

    Upload -->|POST FormData| Analyze
    Analyze -->|Extract Text| PDFParse
    Analyze -->|Analyze + Translate| Qwen
    Qwen -->|JSON Response| Analyze
    Analyze -->|Structured Results| Results
    Results --> Print

    Docker -.-> Analyze
    ECS -.-> Docker
```

## Data Flow

1. **Upload**: Patient uploads a medical report (PDF or raw text)
2. **Extract**: `pdf-parse` extracts text content from the PDF
3. **Analyze**: Qwen Cloud (`qwen-plus`) receives the extracted text with a carefully engineered system prompt
4. **Translate**: Qwen generates plain-language explanations in English AND Hindi simultaneously
5. **Flag**: The system identifies critical/abnormal values and generates prominent alerts
6. **Display**: Results are shown in an accessible, calming healthcare-themed UI
7. **Print**: Patient can print a clean summary to take to their doctor
