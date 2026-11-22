"""Compila o Rust e atualiza os dois arquivos distribuídos com a página."""
import base64
import pathlib
import shutil
import subprocess

pasta = pathlib.Path(__file__).resolve().parent
cargo = shutil.which("cargo")
if cargo is None:
    raise SystemExit("Instale o Rust com Cargo e adicione o alvo wasm32-unknown-unknown.")
subprocess.run(
    [cargo, "build", "--release", "--locked", "--target", "wasm32-unknown-unknown",
     "--manifest-path", str(pasta / "Cargo.toml")],
    check=True,
)
binario = (pasta / "target/wasm32-unknown-unknown/release/trilha_busca.wasm").read_bytes()
(pasta.parent / "busca.wasm").write_bytes(binario)
(pasta.parent / "binario_rust.js").write_text(
    '"use strict";\nconst BINARIO_RUST = "' + base64.b64encode(binario).decode("ascii") + '";\n',
    encoding="utf-8",
)
print("Atualizados busca.wasm e binario_rust.js.")
