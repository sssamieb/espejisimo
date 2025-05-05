//agrandar 
function alternarModo() {
  const modoActivo = document.body.classList.toggle("modo-grande");
  localStorage.setItem("modoGrandeActivo", modoActivo); // Guarda true o false
}
window.addEventListener("DOMContentLoaded", () => {
  const modoGuardado = localStorage.getItem("modoGrandeActivo");
  if (modoGuardado === "true") {
    document.body.classList.add("modo-grande");
  }
});

//tts
function leerTextoPagina() {
  const modalCarrito = document.querySelector('.cart-modal.activo');
  const modalProducto = document.querySelector('#modal-producto.activo');

  let texto = '';

  if (modalCarrito) {
    texto = modalCarrito.innerText;
  } else if (modalProducto) {
    texto = modalProducto.innerText;
  } else {
    texto = document.body.innerText;
  }

  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = 'es-ES';
  mensaje.rate = 1;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  } else {
    window.speechSynthesis.speak(mensaje);
  }
}



// index MODELO3D
let scene, camera, renderer;
let objects = [];
let dragControls;
let selectedModel = null;

//Ambientes 3d
const ambientesHDR = [
    '../../MODELOS3D/AMBIENTES/ambiente.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente1.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente2.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente3.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente4.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente5.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente6.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente7.hdr',
    '../../MODELOS3D/AMBIENTES/ambiente8.hdr',
];
//inicia el 3d 
function init3DScene() {
    const canvas = document.getElementById('canvas3d');

    //configura Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 360 / 600, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(360, 600);

    // entorno
    const rgbeLoader = new THREE.RGBELoader();
    rgbeLoader.setDataType(THREE.UnsignedByteType);

    rgbeLoader.load('../../MODELOS3D/AMBIENTES/ambiente2.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.environment = texture; 
        scene.background = null;     
    });

    // luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);


    // para arrastrar los objetos
    dragControls = new THREE.DragControls(objects, camera, renderer.domElement);

    // para seleccionar los objetos
    dragControls.addEventListener('dragstart', (event) => {
        event.object.material.opacity = 0.7;
        selectedModel = event.object;
    });

    dragControls.addEventListener('dragend', (event) => {
        event.object.material.opacity = 1.0;
    });

    dragControls.addEventListener('hoveron', (event) => {
        selectedModel = event.object;
    });

    // botones de los muebles - se conecta con los del html
    document.querySelectorAll('.mueble-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modelPath = btn.getAttribute('data-model');
            loadGLTFModel(modelPath);
        });
    });

    // botones para agrandar, reducir, rotar y los ambientes
    document.getElementById('btn-agrandar').addEventListener('click', () => {
        if (selectedModel) {
            selectedModel.scale.multiplyScalar(1.2);
        }
    });

    document.getElementById('btn-reducir').addEventListener('click', () => {
        if (selectedModel) {
            selectedModel.scale.multiplyScalar(0.8);
        }
    });

    document.getElementById('btn-rotar').addEventListener('click', () => {
        if (selectedModel) {
            if (selectedModel.name === 'flor' || selectedModel.name === 'espejo') {
                selectedModel.rotation.z += Math.PI / 4;
            } else {
                selectedModel.rotation.y += Math.PI / 4;
            }
        }
    });
    
    //para los ambientes que cambien aleatoriamente
    document.getElementById('btn-ambiente').addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * ambientesHDR.length);
        const selectedHDR = ambientesHDR[randomIndex];
    
        rgbeLoader.load(selectedHDR, function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
        });
    });
    
    // eliminar objeto con clic derecho
      renderer.domElement.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // previene menú de navegador

      if (selectedModel) {
        scene.remove(selectedModel);

        const index = objects.indexOf(selectedModel);
        if (index > -1) {
          objects.splice(index, 1);
          dragControls.getObjects().splice(index, 1);
        }

        selectedModel = null;
      }
    });

    // que se anime
    animate();
  }
  //que cargue el modelo 3d que tiene diferencias en la geometría y materiales
  function loadGLTFModel(modelPath) {
    const loader = new THREE.GLTFLoader();

    loader.load(modelPath, (gltf) => {
        const geometries = [];
        const materials = [];
        const meshGroups = [];

        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.updateMatrix(); // asegura que su posición esté aplicada
                child.geometry.applyMatrix4(child.matrix);

                geometries.push(child.geometry);
                materials.push(child.material);

                // registra el rango de la geometría para ese material
                meshGroups.push({
                    start: 0,
                    count: child.geometry.index ? child.geometry.index.count : child.geometry.attributes.position.count,
                    materialIndex: materials.length - 1
                });
            }
        });

        // fusiona geometrías
        const mergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries, false);

        // añade los grupos (materiales múltiples)
        mergedGeometry.clearGroups();
        let indexOffset = 0;
        for (const group of meshGroups) {
            mergedGeometry.addGroup(indexOffset, group.count, group.materialIndex);
            indexOffset += group.count;
         }

          const mesh = new THREE.Mesh(mergedGeometry, materials);
         mesh.scale.set(0.5, 0.5, 0.5);

          if (modelPath.includes('flor.glb')) {
            mesh.name = 'flor';
            mesh.rotation.x = Math.PI / 2;
            mesh.rotation.y = Math.PI;
            mesh.rotation.z = 30 * (Math.PI / 180);
            mesh.scale.set(0.05, 0.05, 0.05);
          } else if (modelPath.includes('espejo.glb')){
            mesh.name = 'espejo';
            mesh.rotation.x = Math.PI / 2;
            mesh.scale.set(1, 1, 1);
          }

           scene.add(mesh);
           objects.push(mesh);
           dragControls.getObjects().push(mesh);
           selectedModel = mesh;
          }, undefined, (error) => {
        console.error('Error al cargar el modelo:', error);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  // para que inicie a penas se entre a la pagina
  window.addEventListener('load', () => {
    camara();
    init3DScene();
});
//camara
function camara() {
    const video = document.getElementById('camara');
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((error) => {
            console.error('Error al acceder a la cámara:', error);
        });
}

//login
//crear una cuenta temporal
function crearCuenta() {
  abrirModalCrearCuenta();
}

function abrirModalCrearCuenta() {
  document.getElementById('crearCuentaModal').style.display = 'block';
}

function cerrarModalCrearCuenta() {
  document.getElementById('crearCuentaModal').style.display = 'none';
}

function guardarCuentaTemporal(event) {
  event.preventDefault();
  const nuevoUsuario = document.getElementById('nuevoUsuario').value.trim();
  const nuevaClave = document.getElementById('nuevaClave').value.trim();

  if (!nuevoUsuario || !nuevaClave) {
    alert('Por favor completa todos los campos.');
    return;
  }

  const cuentaTemporal = {
    usuario: nuevoUsuario.toUpperCase(),
    clave: nuevaClave
  };

  localStorage.setItem('cuentaTemporal', JSON.stringify(cuentaTemporal));
  localStorage.setItem('usuarioActual', nuevoUsuario.toUpperCase());

  alert(`¡Bienvenido/a, ${nuevoUsuario}! Tu cuenta fue creada.`);
  window.location.href = '../../index.html';
}


//usuarios predeterminados
function ingresar(event){
  event.preventDefault();
  const usu = document.getElementById('usuario').value;
  const cla = document.getElementById('clave').value;

  // verifica si es uno de los usuarios fijos o uno temporal
  if ((usu.toUpperCase() === 'MICHEL' && cla === '555') ||
      (usu.toUpperCase() === 'FABIO' && cla === '111') ||
      (usu.toUpperCase() === 'MATIAS' && cla === '888') ||
      (usu.toUpperCase() === 'SAMIRA' && cla === '222') ||
      (usu.toUpperCase() === 'MICAELA' && cla === '333')) {
    
    localStorage.setItem('usuarioActual', usu.toUpperCase());
    window.location.href = '../../index.html';

  } else {
    // revisa si existe una cuenta temporal
    const cuentaTemporalGuardada = JSON.parse(localStorage.getItem('cuentaTemporal'));

    if (cuentaTemporalGuardada &&
        cuentaTemporalGuardada.usuario === usu.toUpperCase() &&
        cuentaTemporalGuardada.clave === cla) {

      localStorage.setItem('usuarioActual', usu.toUpperCase());
      window.location.href = '../../index.html';

    } else {
      alert('Usuario o Clave incorrectos, intente nuevamente');
    }
  }
}

//ajustar el padding del login
function ajustarPaddingLogin() {
    const loginElement = document.querySelector('.login');
    const usuario = localStorage.getItem('usuarioActual');
  
    if (usuario) {
      loginElement.style.paddingLeft = '870px';
    } else {
      loginElement.style.paddingLeft = '940px';
    }
  }

  //oculta el oferta y hace las cajas del index destacadas clickeables
  // esto espera a que cargue todo el contenido HTML
  window.addEventListener('DOMContentLoaded', () => {
	const nombreUsuario = localStorage.getItem('usuarioActual');
	const usuarioSpan = document.getElementById('usuarioNombre');
	const logoutBtn = document.getElementById('logoutBtn');

	if (nombreUsuario) {
		usuarioSpan.textContent = nombreUsuario;
	}

	logoutBtn.addEventListener('click', function(event) {
		event.preventDefault();
		localStorage.removeItem('usuarioActual');
		window.location.href = '/PAGINAS/ESP/login.html';
	});

	// hace que las cajas del index se puedan clicar y redirigir a la pagina de catalogo
	document.querySelectorAll(".cajas.destacada").forEach(caja => {
		caja.addEventListener("click", function () {
			const categoria = this.getAttribute("data-categoria");
			window.location.href = `/PAGINAS/ESP/catalogo.html?categoria=${categoria}`;
		});
	});

	// ajusta el padding si la función existe
	if (typeof ajustarPaddingLogin === "function") {
		ajustarPaddingLogin();
	}

	// oculta el enlace de ofertas si no hay sesión
	if (!nombreUsuario) {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if (link.getAttribute('href')?.includes('ofertas.html')) {
            const li = link.closest('li');
            if (li) li.style.display = 'none';
        }
    });
}

});


  
//catalogo
document.addEventListener("DOMContentLoaded", function () {
    const esPaginaOfertas = window.location.pathname.includes("ofertas.html");
    const params = new URLSearchParams(window.location.search);
    const categoriaSeleccionada = params.get("categoria");
    //los productos
    const productos = [
      {
        nombre: "Florero Espejo Bronce de Chanel",
        categoria: "floreros",
        precio: 250,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/FLOREROS/flo_bronce.jpg", // imagen horizontal
        imagenes: ["../../IMAGENES/PRODUCTOS/VERTICALES/FLOREROS/flo_bronce.jpg"],
        descripcion: "Florero revestido de espejo bronce, con detalles de la marca Chanel.<br>Incluye las flores de orquidea artificiales siliconadas. <br><br>Medidas: 18x19x69 cm <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Florero Espejo Gris de Chanel",
        categoria: "floreros",
        oferta: 250,
        precio: 300,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/FLOREROS/flo_gris.jpg", // imagen horizontal
        imagenes: ["../../IMAGENES/PRODUCTOS/VERTICALES/FLOREROS/flo_gris.jpg"],
        descripcion: "Florero revestido de espejo gris, con detalles de la marca Chanel.<br>Incluye las flores de orquidea artificiales siliconadas. <br><br>Medidas: 18x16x63 cm <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Florero Espejo Bronce y Plateado",
        categoria: "floreros",
        precio: 250,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/FLOREROS/flo_bronce2.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/FLOREROS/flo_bronce2.jpg"],
        descripcion: "Elegante florero de espejo bronce con detalle frontal de plateado.<br>Incluye las flores de orquidea artificiales siliconadas. <br><br>Medidas: 18x17x60 cm <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Florero Biselado con Detalle Vertical",
        categoria: "floreros",
        precio: 320,
        oferta: 280,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/FLOREROS/flo_bi_ver.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/FLOREROS/flo_bi_ver.jpg"],
        descripcion: "Elegante florero de espejos biselados y detalles verticales de strass.<br>Incluye las flores de orquidea artificiales siliconadas. <br><br>Medidas: 24x20x63 cm <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Florero Biselado con Detalle Horizontal",
        categoria: "floreros",
        precio: 320,
        oferta: 280,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/FLOREROS/flo_bi_hori.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/FLOREROS/flo_bi_hori.jpg"],
        descripcion: "Elegante florero de espejos biselados y detalles horizontales de strass.<br>Incluye las flores de orquidea artificiales siliconadas. <br><br>Medidas: 22x22x65 cm <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Cajonera doble dorada",
        categoria: "muebles",
        precio: 1400,
        oferta: 1200,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/MUEBLES/cajoneradorada.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/cajoneradorada.jpg","../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/cajoneradorada2.jpg"],
        descripcion: "Elegante cajonera doble, con la tapa de vidrio de espejo biselado. <br><br>Medidas:<br> • 120 cm de ancho. <br> • 60 cm de largo. <br> • 30 cm de fondo. <br><br>Material: Melamina, vidrio espejo, fierro dorado y sujetadores de madera."
      },
      {
        nombre: "Mesa Espejada con patas plateadas",
        categoria: "muebles",
        precio: 1100,
        oferta: 980,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/MUEBLES/mesa.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/mesa.jpg"],
        descripcion: "Hermosa mesa espejada con patas plateadas cromadas. <br><br>Medidas:<br> • 60 cm de ancho. <br> • 90 cm de largo. <br> • 40 cm de alto. <br><br>Material: Melamina, vidrio espejo y patas cromadas."
      },
      {
        nombre: "Mesa Flotante Espejada",
        categoria: "muebles",
        precio: 1000,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/MUEBLES/mesaa.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/mesaa.jpg", "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/mesaa2.jpg"],
        descripcion: "Mesa de centro flotante espejada con tapa biselada. <br><br>Medidas:<br> • 60 cm de ancho. <br> • 90 cm de largo. <br> • 40 cm de largo. <br><br>Material: Melamina y vidrio espejo. <br><br> <a href='../../index.html#sede-central'>Click Aquí para probar este modelo con nuestra Realidad Aumentada.</a>"
      },
      {
        nombre: "Recibidor Espejado",
        categoria: "muebles",
        precio: 1300,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/MUEBLES/mueble.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/mueble.jpg"],
        descripcion: "Elegante recibidor de espejos biselados. <br><br>Medidas:<br> • 100 cm de ancho. <br> • 90 cm de largo. <br> • 30 cm de fondo. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Veladores de Fierro Color Negro",
        categoria: "muebles",
        precio: 1100,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/MUEBLES/veladores.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/veladores.jpg", "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/veladores2.jpg", "../../IMAGENES/PRODUCTOS/VERTICALES/MUEBLES/veladores3.jpg"],
        descripcion: "Veladores espejados con base de fierro negro, tapa y frente de espejo biselado a 550 Bs. cada uno. <br><br>Medidas: <br> • 51 cm de ancho. <br> • 40 cm de largo. <br> • 66 cm de alto. <br><br>Material: Melamina, vidrio espejo y fierro."
      },
      {
        nombre: "Espejo Dorado Horizontal Diamante",
        categoria: "espejos",
        precio: 800,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ESPEJOS/espejogoldh.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ESPEJOS/espejogoldh.jpg"],
        descripcion: "Espejo dorado horizontal con forma de diamante, con marco de madera y espejo pulido de 3mm. <br><br>Medidas: <br> • 60 cm de ancho. <br> • 120 cm de largo. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Espejo Dorado Horizontal",
        categoria: "espejos",
        precio: 1000,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ESPEJOS/espejogoldhh.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ESPEJOS/espejogoldhh.jpg"],
        descripcion: "Espejo con fondo dorado, con marco de madera. <br><br>Medidas: <br> • 60 cm de ancho. <br> • 120 cm de largo. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Espejo Negro Estilo Industrial",
        categoria: "espejos",
        precio: 800,
        oferta: 600,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ESPEJOS/espejonegroh.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ESPEJOS/espejonegroh.jpg"],
        descripcion: "Espejo estilo industrial color negro, con marco de madera y espejo pulido de 3mm. <br> Se puede colgar horizontal o vertical <br><br>Medidas: <br> • 60 cm de ancho. <br> • 120 cm de largo. <br><br>Material: Melamina y vidrio espejo. "
      },
      {
        nombre: "Espejo Redondo con fondo Negro",
        categoria: "espejos",
        precio: 500,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ESPEJOS/espejore.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ESPEJOS/espejore.jpg", "../../IMAGENES/PRODUCTOS/VERTICALES/ESPEJOS/espejore2.jpg"],
        descripcion: "Espejo de vidrio pulido de 3mm de grosor. <br><br> Medidas: <br> 90 cm de diametro. <br><br>Materiales: Melamina y vidrio espejo. <br><br> <a href='../../index.html#sede-central'>Click Aquí para probar este modelo con nuestra Realidad Aumentada.</a>"
      },
      {
        nombre: "Espejo Dorado Ventana / Tic Tac Toe",
        categoria: "espejos",
        precio: 600,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ESPEJOS/espejotictac.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ESPEJOS/espejotictac.jpg", "../../IMAGENES/PRODUCTOS/VERTICALES/ESPEJOS/espejotictac2.jpg"],
        descripcion: "Espejo tipo industrial Dorado, con marco de madera y espejo de 3mm. <br><br> Medidas: 91x91 cm. <br><br>Materiales: Melamina y vidrio espejo."
      },
      {
        nombre: "Estante dorado",
        categoria: "bandejas",
        precio: 230,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/BANDEJAS/bandejadoble.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/bandejadoble.jpg", "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/doblebandeja.png"],
        descripcion: "Estante de fierro dorado con bases de bandejas espejadas biseladas. <br>*No incluye los adornos.* <br><br>Medidas: <br> • 52 cm de ancho. <br> • 37 cm de largo. <br> • 17 cm de fondo. <br><br>Material: Fierro y vidrio espejo."
      },
      {
        nombre: "Bandeja Dorada Rectangular",
        categoria: "bandejas",
        precio: 130,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/BANDEJAS/bandor.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/bandor.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/bandor2.jpeg"],
        descripcion: "Bandeja dorada <br><br>Medidas: 29X30 cm. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Bandeja Dorada Alta Rectangular",
        categoria: "bandejas",
        precio: 170,
        oferta: 150,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/BANDEJAS/banndor.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/banndor.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/banndor2.jpeg"],
        descripcion: "Bandeja dorada con base de fierro. <br><br>Medidas: 21X28X12 cm <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Bandeja Plateada Circular",
        categoria: "bandejas",
        precio: 200,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/BANDEJAS/banpla.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/banpla.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/banpla2.jpeg"],
        descripcion: "Bandeja de base de madera, espejo pulido redondo de 3mm. Base de madera revestida de espejo pulido. <br><br> Medidas: 38X12 cm. <br><br> Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Bandeja Plateada Rectangular",
        categoria: "bandejas",
        precio: 150,
        oferta: 130,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/BANDEJAS/bannpla.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/bannpla.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/bannpla2.jpeg",  "../../IMAGENES/PRODUCTOS/VERTICALES/BANDEJAS/bandejaplateada.jpeg"],
        descripcion: "Bandeja plateada rectangular. <br><br>Medidas: 25x35 cm. <br><br> Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Corazon dorado",
        categoria: "accesorios",
        precio: 40,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ACCESORIOS/corazon.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/corazon.jpeg"],
        descripcion: "Lindo adorno en forma de corazón dorado."
      },
      {
        nombre: "Elefante dorado",
        categoria: "accesorios",
        precio: 60,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ACCESORIOS/eledor.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/eledor.jpeg","../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/eledor2.jpeg"],
        descripcion: "Lindo adorno en forma de elefante dorado."
      },
      {
        nombre: "Pajaritos Plateados",
        categoria: "accesorios",
        precio: 100,
        oferta: 90,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ACCESORIOS/pajaritos.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/pajaritos.jpeg"],
        descripcion: "Par de pajaritos plateados."
      },
      {
        nombre: "Ositos Plateados",
        categoria: "accesorios",
        precio: 100,
        oferta: 80,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ACCESORIOS/ositos.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/ositos.jpeg"],
        descripcion: "Par de ositos plateados."
      },
      {
        nombre: "Marcos de Fotos Espejados",
        categoria: "accesorios",
        precio: 150,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ACCESORIOS/marcos.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/accesorio3.jpg"],
        descripcion: "Marcos Espejados para atesorar los recuerdos mas preciados. <br> Juego de 2 marcos. <br><br> Medidas: 10X15 cm y 13X18 cm."
      },
      {
        nombre: "Elefante Plateado",
        categoria: "accesorios",
        precio: 80,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/ACCESORIOS/elepla.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/elepla.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/ACCESORIOS/elepla2.jpeg"],
        descripcion: "Lindo adorno en forma de elefante plateado."
      },
      {
        nombre: "Cuadro Flor Cuadrada",
        categoria: "cuadros",
        precio: 150,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/CUADROS/cuadro1.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro1.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro1-1.jpeg"],
        descripcion: "Hermoso cuadro espejado con diseño al medio. <br><br>Medidas: <br> • 37 cm de ancho. <br> • 37 cm de largo. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Cuadro Flor Redonda",
        categoria: "cuadros",
        precio: 150,
        oferta:145,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/CUADROS/cuadro2.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro2.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro2-2.jpeg"],
        descripcion: "Hermoso cuadro espejado con diseño al medio. <br><br>Medidas: <br> • 37 cm de ancho. <br> • 37 cm de largo. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Cuadro Piña Plateada",
        categoria: "cuadros",
        precio: 150,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/CUADROS/cuadro3.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro3.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro3-3.jpeg"],
        descripcion: "Hermoso cuadro espejado con diseño de piña plateada. <br><br>Medidas: <br> • 19 cm de ancho. <br> • 33 cm de largo. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Cuadro Piña Dorada",
        categoria: "cuadros",
        precio: 150,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/CUADROS/cuadro4.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro4.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro4-4.jpeg"],
        descripcion: "Hermoso cuadro espejado con diseño de piña dorada. <br><br>Medidas: <br> • 23 cm de ancho. <br> • 37 cm de largo. <br><br>Material: Melamina y vidrio espejo."
      },
      {
        nombre: "Cuadro Corazon",
        categoria: "cuadros",
        precio: 150,
        imagenCatalogo: "../../IMAGENES/PRODUCTOS/HORIZONTALES/CUADROS/cuadro5.jpg", // imagen horizontal
        imagenes: [ "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro5.jpeg", "../../IMAGENES/PRODUCTOS/VERTICALES/CUADROS/cuadro5-5.jpeg"],
        descripcion: "Hermoso cuadro espejado con diseño de corazón. <br><br>Medidas: <br> • 35 cm de ancho. <br> • 25 cm de largo. <br><br>Material: Melamina y vidrio espejo."
      }

      // ... poner mas productos aquí
    ];
  
    const contenedor = document.getElementById("productos");
  
    // si estamos en la página de ofertas, solo mostramos los productos con oferta
    const usuarioActual = localStorage.getItem("usuarioActual");

if (esPaginaOfertas) {
  if (usuarioActual) {
    // muestra los productos en oferta si el usuario está logueado
    productos.filter(producto => producto.oferta).forEach(producto => {
      const div = document.createElement("div");
      div.classList.add("producto", "con-oferta");
      div.setAttribute("data-categoria", producto.categoria);

      div.innerHTML = `
        <div class="producto-contenedor">
          <img src="${producto.imagenCatalogo}" alt="${producto.nombre}">
          <h3 class="producto-nombre">${producto.nombre}</h3>
          <div class="precio-container">
            <span class="precio-normal">${producto.precio.toFixed(2)} Bs.</span>
            <span class="precio-oferta">${producto.oferta.toFixed(2)} Bs.</span>
          </div>
        </div>
      `;
      div.addEventListener("click", () => mostrarModal(producto));
      contenedor.appendChild(div);
    });
  } else {
    // Usuario no logueado: mostrar mensaje y no mostrar productos
    const mensaje = document.createElement("p");
    mensaje.textContent = "Iniciá sesión para descubrir nuestras ofertas.";
    mensaje.style.textAlign = "center";
    mensaje.style.fontWeight = "bold";
    mensaje.style.marginTop = "50px";
    contenedor.appendChild(mensaje);
  }
  } else {
  // Página catálogo
  productos.forEach(producto => {
    // Mostrar solo productos sin oferta si NO hay usuario
    if (!usuarioActual && producto.oferta) return;

    const div = document.createElement("div");
    div.classList.add("producto");
    if (producto.oferta) div.classList.add("con-oferta");
    div.setAttribute("data-categoria", producto.categoria);

    div.innerHTML = `
      <div class="producto-contenedor">
        <img src="${producto.imagenCatalogo}" alt="${producto.nombre}">
        <h3 class="producto-nombre">${producto.nombre}</h3>
        <div class="precio-container">
          ${producto.oferta ? `
            <span class="precio-normal">${producto.precio.toFixed(2)} Bs.</span>
            <span class="precio-oferta">${producto.oferta.toFixed(2)} Bs.</span>
          ` : `
            <span class="precio-normal-unico">${producto.precio.toFixed(2)} Bs.</span>
          `}
        </div>
      </div>
    `;
    div.addEventListener("click", () => mostrarModal(producto));
    contenedor.appendChild(div);
  });
  }

  
    // Filtrado
    const botones = document.querySelectorAll(".filtro-btn");
  
    function filtrar(categoria) {
      const productosDOM = document.querySelectorAll(".producto");
      let hayResultados = false;
  
      productosDOM.forEach(producto => {
        const cat = producto.getAttribute("data-categoria");
        if (categoria === "todo" || cat === categoria) {
          producto.style.display = "block";
          hayResultados = true;
        } else {
          producto.style.display = "none";
        }
      });
  
      let mensaje = document.getElementById("mensaje-vacio");
      if (!mensaje) {
        mensaje = document.createElement("p");
        mensaje.id = "mensaje-vacio";
        mensaje.style.textAlign = "center";
        mensaje.style.marginTop = "20px";
        mensaje.style.fontWeight = "bold";
        document.getElementById("productos").appendChild(mensaje);
      }
  
      mensaje.textContent = hayResultados ? "" : "No hay productos de esta categoría";
    }
  
    botones.forEach(btn => {
      btn.addEventListener("click", function () {
        document.querySelector(".filtro-btn.activo")?.classList.remove("activo");
        this.classList.add("activo");
        const categoria = this.getAttribute("data-categoria");
        filtrar(categoria);
      });
    });
  
    // Filtrado por defecto, solo en la página de catálogo
    if (!esPaginaOfertas) {
        filtrar(categoriaSeleccionada || "todo");
    }
  
    // Modal
    const modal = document.getElementById("modal-producto");
    const cerrar = modal.querySelector(".cerrar");
    const imagenesCont = document.getElementById("modal-imagenes");
    const infoCont = document.getElementById("modal-info");
  
    let imagenActual = 0;
    let imagenesActuales = [];
  
    function mostrarModal(producto) {
      imagenesActuales = producto.imagenes;
      imagenActual = 0;
      actualizarImagen();
  
      infoCont.innerHTML = `
        <h2>${producto.nombre}</h2>
        ${producto.oferta ? `
          <span class="precio-normal">${producto.precio.toFixed(2)} Bs.</span>
          <span class="precio-oferta">${producto.oferta.toFixed(2)} Bs.</span>
        ` : `
          <span class="precio-normal-unico">${producto.precio.toFixed(2)} Bs.</span>
        `}
        <p>${producto.descripcion}</p>
        <div class="contenedor-boton">
          <button onclick="agregarAlCarrito('${producto.nombre}', ${producto.oferta ? producto.oferta : producto.precio}, '${producto.imagenes[0]}')" class="btn-agregar">Agregar al carrito</button>
        </div>


      `;
  
      modal.classList.add("activo");
  
      document.getElementById("anterior-img").style.display = imagenesActuales.length > 1 ? "block" : "none";
      document.getElementById("siguiente-img").style.display = imagenesActuales.length > 1 ? "block" : "none";
    }
  
    function actualizarImagen() {
      imagenesCont.innerHTML = `<img src="${imagenesActuales[imagenActual]}" alt="Imagen ${imagenActual + 1}">`;
    }
  
    // Navegación de imágenes
    document.getElementById("anterior-img").addEventListener("click", e => {
      e.stopPropagation();
      imagenActual = (imagenActual - 1 + imagenesActuales.length) % imagenesActuales.length;
      actualizarImagen();
    });
  
    document.getElementById("siguiente-img").addEventListener("click", e => {
      e.stopPropagation();
      imagenActual = (imagenActual + 1) % imagenesActuales.length;
      actualizarImagen();
    });
  
    cerrar.addEventListener("click", () => modal.classList.remove("activo"));
    modal.addEventListener("click", e => {
      if (e.target === modal) modal.classList.remove("activo");
    });
  
  });
  
// resenas

// Simula una sesión con localStorage
const userLoggedIn = localStorage.getItem('usuarioActual');


// Imágenes de usuario aleatorias
const userImages = [
  '../../IMAGENES/ICONOS/1.png',
  '../../IMAGENES/ICONOS/2.png',
  '../../IMAGENES/ICONOS/3.png',
  '../../IMAGENES/ICONOS/4.png',
  '../../IMAGENES/ICONOS/5.png',
  '../../IMAGENES/ICONOS/6.png',
  '../../IMAGENES/ICONOS/7.png',
];

// Muestra el formulario si hay usuario logueado
document.addEventListener('DOMContentLoaded', () => {
  if (userLoggedIn) {
    const formContainer = document.getElementById('review-form-container');
    if (formContainer) formContainer.style.display = 'block';
  }

  renderReviews();
});

// Reseñas predeterminadas
const reviews = [
  {
    user: 'FABIO',
    rating: 5,
    product: 'Cajonera Doble Dorada',
    comment: 'Es un mueble que se acomoda bien en mi sala, la atención fue muy amable al momento de comprarlo.',
    img: userImages[0],
  },
  {
    user: 'MICAELA',
    rating: 4,
    product: 'Espejo Dorado Horizontal Diamante',
    comment: 'Me encantó el diseño de este espejo, quedó muy hermoso en mi habitación.',
    img: userImages[1],
  },
  {
    user: 'MICHEL',
    rating: 4,
    product: 'Bandeja Dorada',
    comment: 'Perfecta para adornar la mesa en la comidas familiares, todos la halagan porque hace que la comida brille más.',
    img: userImages[2],
  },
  {
    user: 'MATIAS',
    rating: 5,
    product: 'Florero Espejo Gris de Chanel',
    comment: 'Lo compré como regalo para mi madre, quedó encantada con el florero, y las flores artificiales lucen muy realistas.',
    img: userImages[3],
  },
  {
    user: 'SAMIRA',
    rating: 5,
    product: 'Mesa Espejada',
    comment: 'Quedó espectactular en el centro de mi sala, tal y como lo había pre-visto con la función de realidad aumentada.',
    img: userImages[4],
  },
];
// Cargar reseñas de sesión si existen
const storedReviews = sessionStorage.getItem('sessionReviews');
if (storedReviews) {
  const sessionData = JSON.parse(storedReviews);
  reviews.unshift(...sessionData); // Mostrar primero las reseñas de esta sesión
}

// Renderiza las reseñas
function renderReviews() {
  const container = document.getElementById('reviews-list');
  if (!container) return;
  container.innerHTML = '';

  reviews.forEach((r) => {
    container.innerHTML += `
      <div class="review-item">
        <div class="review-header">
          <div class="user-info">
            <img src="${r.img}" alt="user">
            <strong>${r.user}</strong>
          </div>
          <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <h4>${r.product}</h4>
        <p>${r.comment}</p>
      </div>
    `;
  });
}

// Enviar nueva reseña
function submitReview() {
  const name = document.getElementById('product-name').value.trim();
  const comment = document.getElementById('comment').value.trim();
  const rating = parseInt(document.querySelector('input[name="rate"]:checked')?.value || 0);


  if (!userLoggedIn) {
    alert('Debes iniciar sesión para escribir una reseña.');
    return;
  }

  if (!name || !comment || !rating) {
    alert('Por favor completa todos los campos.');
    return;
  }

  const newReview = {
    user: userLoggedIn,
    rating: rating,
    product: name,
    comment: comment,
    img: userImages[Math.floor(Math.random() * userImages.length)],
  };

  reviews.unshift(newReview);
  renderReviews();
  // Guardar en sessionStorage
    const currentSessionReviews = JSON.parse(sessionStorage.getItem('sessionReviews')) || [];
currentSessionReviews.unshift(newReview);
sessionStorage.setItem('sessionReviews', JSON.stringify(currentSessionReviews));


  // Limpiar el formulario
  document.getElementById('product-name').value = '';
  document.getElementById('comment').value = '';
  document.getElementById('rating').value = '5';
}

// Exportar si se necesita en otros scripts
window.submitReview = submitReview;


// carrito
let carrito = [];

function abrirCarrito() {
  const usuario = localStorage.getItem('usuarioActual');
  if (!usuario) {
    alert("Inicia sesión para agregar cosas aquí.");
    return;
  }
  document.getElementById('cart-modal').classList.add('activo'); // Mostrar el modal
  cargarCarrito(); // <<< Cargar carrito actualizado (por si viene de otra página)
  renderizarCarrito(); // <<< Volver a pintar los productos
}


function cerrarCarrito() {
  document.getElementById('cart-modal').classList.remove('activo'); // Ocultar el modal
}

function agregarAlCarrito(nombre, precio, imagen) {
  const usuario = localStorage.getItem('usuarioActual');
  if (!usuario) {
    alert("Inicia sesión para agregar cosas aquí.");
    return;
  }
  carrito.push({ nombre, precio, imagen });
  guardarCarrito(); // <<<<<< GUARDAR CADA VEZ QUE AGREGAS
  alert("Producto agregado al carrito");
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito(); // <<<<<< GUARDAR CADA VEZ QUE ELIMINAS
  renderizarCarrito();
}


function renderizarCarrito() {
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';

  let total = 0;
  carrito.forEach((producto, index) => {
    const item = document.createElement('div');
    item.classList.add('carrito-item');

    item.innerHTML = `
      <img src="${producto.imagen}" alt="Imagen del producto" class="carrito-imagen">
      <div class="carrito-info">
        <p>${producto.nombre} - ${producto.precio.toFixed(2)} Bs.</p>
        <button class="eliminar-item" onclick="eliminarDelCarrito(${index})">✖️</button>
      </div>
    `;

    cartItems.appendChild(item);
    total += producto.precio;
  });

  document.getElementById('total-price').innerText = `Total: ${total.toFixed(2)} Bs.`;
}
function finalizarCompra() {
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  let mensaje = "Hola, me interesa";
  if (carrito.length === 1) {
    mensaje += ` este producto: ${carrito[0].nombre} con valor de ${carrito[0].precio} Bs. ¿Está disponible?`;
  } else {
    mensaje += " estos productos: ";
    carrito.forEach((producto, index) => {
      mensaje += `${producto.nombre} a ${producto.precio} Bs.`;
      if (index !== carrito.length - 1) mensaje += ", ";
    });
    mensaje += ". ¿Están disponibles?";
  }

  const url = `https://wa.me/59160883366?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

function guardarCarrito() {
  sessionStorage.setItem('carrito', JSON.stringify(carrito)); // Guardar carrito en sessionStorage
}
function cargarCarrito() {
  const carritoGuardado = sessionStorage.getItem('carrito');
  if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado); // Recuperar carrito y convertirlo a objeto
  }
}
// Cargar el carrito al inicio
window.onload = function() {
  cargarCarrito();
  renderizarCarrito(); // Renderiza el carrito recuperado
};

//faq
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      question.classList.toggle('active');
      const answer = question.nextElementSibling;
      answer.classList.toggle('open');
    });
  });
});

// chatbot
const preguntasIniciales = [
  {
    texto: "¿Cuáles son sus horarios?",
    respuesta: "Atendemos de lunes a sábado de 9:00 a 12:00 y de 15:00 a 19:30.",
    siguientes: [
      { texto: "¿Atienden en feriados?", respuesta: "Solo con citas previas." },
      { texto: "¿Hay atención fuera del horario?", respuesta: "Solo con citas previas." },
      { texto: "¿Cómo agendo una cita?", respuesta: "Mediante WhatsApp, <a href='https://wa.me/59160883366?text=¡Hola!%20Quiero%20agendar%20una%20cita%20de%20visita%20a%20su%20tienda.'>Click Aquí para escribirnos</a>." }
    ]
  },
  {
    texto: "¿Hacen envíos?",
    respuesta: "Sí, hacemos envíos a todo el país.",
    siguientes: [
      { texto: "¿Cuánto es el costo del delivery?", respuesta: "El costo del envío depende de la distancia entre la tienda y su domicilio. <a href='https://wa.me/59160883366?text=¡Hola!%20Quiero%20cotizar%20el%20costo%20del%20envío%20a%20mi%20domicilio.'>Click Aquí para consultar el costo</a>." },
      { texto: "¿Hacen envíos a todos los departamentos?", respuesta: "Sí, a los 9 departamentos." },
      { texto: "¿Cómo envían a otros departamentos?", respuesta: "Con el producto ya pagado, nosotros lo envíamos mediante la transportadora de preferencia del cliente y el costo del envío corre por parte del comprador." }
    ]
  },
  {
    texto: "¿Dónde están ubicados?",
    respuesta: "Nuestra sede central está en la Zona Norte, entre el 7mo anillo y 8vo anillo, Av. Beni, Calle H, nro 18.",
    siguientes: [
      { texto: "¿Tienen más sucursales?", respuesta: "Sí, nuestra segunda sucursal está en el 5to anillo, Radial 26 en el Condominio Los Mangales, Calle 4 Oeste, Casa 3." },
      {texto: "Ubicaciones en GPS", respuesta: "<a href='../../index.html#sede-central'>Click Aquí para la Sede Central</a><br><br> <a href='../../index.html#segunda-sucursal'>Click Aquí para la Segunda Sucursal</a>" }
    ]
  }
];

let preguntasPendientes = [...preguntasIniciales];
let subPreguntasPendientes = [];
let estadoActual = null;

function toggleChatbox() {
  const chatbox = document.getElementById("chatbox");
  const messages = document.getElementById("chatbox-messages");
  const options = document.querySelector(".chatbox-options");

  const isOpen = chatbox.style.display === "flex";
  chatbox.style.display = isOpen ? "none" : "flex";

  if (!isOpen && messages.children.length === 0) {
    const usuario = localStorage.getItem("usuarioActual") || "usuario";
    const saludo = `¡Hola, ${usuario}! ¿En qué puedo ayudarte hoy?`;
    const saludoElem = document.createElement("div");
    saludoElem.className = "bot-message";
    saludoElem.innerText = saludo;
    messages.appendChild(saludoElem);
    mostrarOpciones();
  }
}

function mostrarOpciones() {
  const options = document.querySelector(".chatbox-options");
  options.innerHTML = "";

  if (subPreguntasPendientes.length > 0) {
    subPreguntasPendientes.forEach((pregunta, index) => {
      const btn = document.createElement("button");
      btn.innerText = pregunta.texto;
      btn.onclick = () => responder(pregunta, true);
      options.appendChild(btn);
    });
  } else if (preguntasPendientes.length > 0) {
    preguntasPendientes.forEach((pregunta, index) => {
      const btn = document.createElement("button");
      btn.innerText = pregunta.texto;
      btn.onclick = () => responder(pregunta);
      options.appendChild(btn);
    });
  } else {
    despedirUsuario();
  }
}

function responder(pregunta, esSubPregunta = false) {
  const mensajes = document.getElementById("chatbox-messages");

  const userMsg = document.createElement("div");
  userMsg.className = "user-message";
  userMsg.innerText = pregunta.texto;
  mensajes.appendChild(userMsg);

  const botMsg = document.createElement("div");
  botMsg.className = "bot-message";
  botMsg.innerHTML = pregunta.respuesta;
  mensajes.appendChild(botMsg);

  mensajes.scrollTop = mensajes.scrollHeight;

  if (!esSubPregunta) {
    const index = preguntasPendientes.findIndex(p => p.texto === pregunta.texto);
    if (index !== -1) {
      preguntasPendientes.splice(index, 1);
      subPreguntasPendientes = [...pregunta.siguientes];
    }
  } else {
    const index = subPreguntasPendientes.findIndex(p => p.texto === pregunta.texto);
    if (index !== -1) {
      subPreguntasPendientes.splice(index, 1);
    }
  }

  setTimeout(mostrarOpciones, 500);
}


function despedirUsuario() {
  const mensajes = document.getElementById("chatbox-messages");
  const botMsg = document.createElement("div");
  botMsg.className = "bot-message";
  botMsg.innerHTML = "¡Gracias por chatear con nosotros! Si tenés más preguntas, <a href='https://wa.me/59160883366'>clickea aquí para hablarnos por WhatsApp</a>. ¡Hasta luego!";
  mensajes.appendChild(botMsg);
  document.querySelector(".chatbox-options").innerHTML = "";
}