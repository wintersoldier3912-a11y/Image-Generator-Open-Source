# text2image-open

**Local-first Text → Image Generator**

An open-source, local-first text→image generator built with Hugging Face Diffusers and PyTorch. It provides an easy-to-use Streamlit UI, GPU and CPU runtime paths (ONNX/ORT fallback for CPU), prompt-engineering presets, content filtering, watermarking, metadata storage, and developer-friendly tooling so you can run, extend, and ship a production-ready repository.

---

## Key features

* Text prompt → high-quality images pipeline (supports multiple open-source diffusion models)
* GPU (PyTorch) and CPU (PyTorch CPU or ONNX Runtime) execution paths
* Adjustable generation parameters: number of images, steps, guidance scale, seed, image size
* Style presets and negative prompts for prompt engineering
* Generation progress and cancellable runs in the UI
* Output saving with structured metadata (prompt, negative prompt, params, seed, model, timestamp)
* Simple content filter (keyword-based) and optional safety checks
* Watermarking option to indicate AI origin
* Minimal test coverage and CI-ready layout
* Documentation, sample prompts, and sample outputs included

---

## Repository layout

```
text2image-open/
├─ README.md
├─ LICENSE
├─ requirements.txt
├─ environment.yml
├─ scripts/
│  ├─ run_gpu.sh
│  ├─ run_cpu.sh
│  └─ export_onnx.py
├─ app/
│  ├─ streamlit_app.py
│  ├─ generate.py
│  ├─ ui_helpers.py
│  └─ utils.py
├─ models/                # model config pointers (do NOT store weights)
├─ metadata_store/
│  └─ history.json
├─ outputs/
│  └─ YYYY-MM-DD/
├─ notebooks/
├─ tests/
│  ├─ test_generate.py
│  └─ test_metadata.py
└─ docs/
   ├─ prompt_tips.md
   ├─ ethical_guidelines.md
   └─ hardware_notes.md
```

---

## Quick start

> Choose the GPU path if you have a CUDA-capable GPU. If you do not, use the CPU path (slower). The README assumes Python 3.10+.

### 1. Create a virtual environment and install dependencies

```bash
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
# .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> If you prefer conda, use the provided `environment.yml`.

### 2. Configure the environment

* Copy `.env.example` to `.env` and set runtime options (model id / path, device preference). If you don't have a model locally, follow the model provider's instructions to obtain weights and place them in the `models/` directory or reference them by provider id.

### 3. Run the Streamlit UI (GPU recommended)

```bash
streamlit run app/streamlit_app.py
```

### 4. Run CPU path (simple)

```bash
bash scripts/run_cpu.sh
# or
python app/streamlit_app.py --cpu
```

### 5. Export to ONNX (optional)

```bash
python scripts/export_onnx.py --model <model-checkpoint> --out models/model.onnx
```

---

## Requirements

* Python 3.10 or newer
* PyTorch (match your CUDA version for GPU usage)
* diffusers, transformers, accelerate
* Pillow, numpy, tqdm
* streamlit
* ONNX Runtime (if using ONNX CPU fallback)
* (Optional) xformers for memory/speed improvements on GPU

Exact pinned versions are provided in `requirements.txt`.

---

## Models and licensing

This project uses open-source diffusion models. **Do not commit model weights** to this repository. Instead, reference models in `models/` by name and instruct users to download weights separately and respect each model's license. The README includes model recommendations and minimum hardware guidance.

Recommended model options (choose based on hardware):

* Lightweight: Stable Diffusion 1.5 (for low-memory GPU)
* Mid-range: Stable Diffusion 2.x
* High-quality: SDXL (requires large-memory GPU, e.g., 24GB VRAM)

Always verify and follow each model's license and usage terms.

---

## Usage and UI Overview

The Streamlit UI includes:

* Prompt input (main)
* Negative prompt input
* Preset dropdown (Photorealistic, Artistic, Cartoon, Cinematic, etc.)
* Sliders for steps, guidance scale, number of images, image size
* Seed (optional) for deterministic outputs
* Watermark toggle
* Progress bar and cancel button
* Gallery / history showing saved images and metadata with download button

### Save structure

Outputs are saved under `outputs/YYYY-MM-DD/` with the filename format:

```
<timestamp>__seed-<seed>__model-<model_name>__idx-<n>.png
```

An accompanying JSON file records metadata about each generated image (prompt, negative_prompt, params, timestamp, model, seed, filename).

---

## Prompt engineering

Ship with a small library of working prompt templates and negative prompts. Examples:

**Presets**

* Photorealistic: `A hyper-detailed portrait, 85mm lens, professional studio lighting, ultra realistic, highly detailed, 8k`
* Futuristic cityscape: `Futuristic city at sunset, neon lights, cinematic wide-angle, highly detailed, digital painting`
* Cartoon: `Cartoon style fox in a whimsical forest, bold line art, vibrant colors`

**Negative prompts**

* `lowres, watermark, text, deformed, extra limbs`

Refer to `docs/prompt_tips.md` for more examples and tips.

---

## Safety & ethical guidelines

This project includes a straightforward content filter (keyword-based) to block or flag sexual, violent, or illegal prompts. This is a basic mitigation — it is not foolproof. The repository contains an `ethical_guidelines.md` detailing responsible usage, watermarking recommendations, and policies for model use.

Watermarking is available as an option and is recommended for public sharing of AI-generated images.

**Important:** The filter is an aid, not a replacement for human oversight. Users must abide by local laws, platform policies, and model-specific licenses.

---

## Performance & hardware notes

* GPU usage: For Stable Diffusion-level models, a GPU with at least 8–12 GB VRAM is recommended for small images. For SDXL or high-resolution generation, 24 GB VRAM or model sharding across GPUs may be required.
* CPU usage: Possible with ONNX Runtime but will be orders of magnitude slower. Use for prototyping only.
* Optional: install `xformers` for memory efficiency on GPU.

See `docs/hardware_notes.md` for more precise numbers and optimization tips.

---

## Developer notes

### Model wrapper (`app/generate.py`)

* Contains functions to load model in GPU/CPU mode, generate images given prompt(s), and return PIL images plus metadata objects.
* Enforces deterministic seeding when a seed is provided.

### UI helpers (`app/ui_helpers.py`)

* Utilities for watermarking, saving metadata, formatting filenames, and rendering galleries.

### Tests

* `tests/test_generate.py` contains smoke tests using a tiny mocked pipeline or distilled model to ensure the generate function runs and metadata is saved.

---

## Tests & CI

* Run tests with `pytest`.
* CI pipeline should run minimal unit tests and linting only (do not run full generation tests on CI due to heavy GPU requirements).

---

## Contribution

Contributions are welcome. Typical contributions:

* Add new prompt presets
* Improve safety checks or integrate model-based content detection
* Add ONNX export optimizations
* Provide additional UI polish or localization

Before contributing, ensure you:

* Open an issue describing the change
* Create a feature branch
* Keep changes small and focused

---

## Limitations & future work

* Basic keyword-based filtering is limited. Integrating model-based safety (e.g., vision-language classifiers) is recommended for stronger controls.
* ONNX export and CPU optimization require careful testing for each model checkpoint.
* Multi-GPU support, autoscaling, and batch generation are potential improvements.

---

## Contact & support

Open issues in the repository for bugs and feature requests. Include system details, model choice, and relevant logs when reporting problems.

---

## License

The project code is released under the MIT License (see LICENSE). Model weights are subject to their own licenses and should be obtained and used in compliance with those terms.

---

## Example commands (summary)

```bash
# Setup
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run (GPU)
streamlit run app/streamlit_app.py

# Run (CPU fallback)
bash scripts/run_cpu.sh

# Export to ONNX (optional)
python scripts/export_onnx.py --model <checkpoint> --out models/model.onnx

# Run tests
pytest -q
```

---

Thank you for using `text2image-open` — a lightweight, local-first text→image generator. If you want, I can also generate a starter `streamlit_app.py` with the UI skeleton and a `generate.py` model wrapper to go with this README.


