
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('formRegistro');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Formulario válido - aquí se puede agregar el envío de datos
    alert('¡Registro exitoso!');
    form.reset();
    form.classList.remove('was-validated');

    const modalElement = document.getElementById('staticBackdrop');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  });
});
