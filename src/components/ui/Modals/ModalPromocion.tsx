import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Checkbox, FormControlLabel, Grid, Typography, IconButton, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Button, Card, CardMedia, CardActions } from '@mui/material';
import PromocionService from '../../../services/PromocionService';
import EmpresaService from '../../../services/EmpresaService';
import SucursalService from '../../../services/SucursalService';
import ISucursal from '../../../types/ISucursal';
import PromocionPost from '../../../types/post/PromocionPost';
import IPromocion from '../../../types/IPromocion';
import GenericModal from './GenericModal';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import TextFieldValue from '../TextFieldValue/TextFieldValue';
import { TipoPromocion } from '../../../types/enums/TipoPromocion';
import ImagenService from '../../../services/ImagenService';
import { Delete, PhotoCamera } from '@mui/icons-material';
import IImagen from '../../../types/IImagen';

import PromocionDetalleService from '../../../services/PromocionDetalleService';
import Column from '../../../types/Column';
import TableComponent from '../Tables/Table/TableComponent';
import ArticuloSeleccionado from '../Cards/ArticulosSeleccionados/ArticulosSeleccionados';


interface ModalPromocionProps {
    modalName: string;
    initialValues: PromocionPost | any;
    isEditMode: boolean;
    fetchPromociones: () => void;
    promocionAEditar?: any;
    idSucursal: number;
    onClose: () => void;
}

const ModalPromocion: React.FC<ModalPromocionProps> = ({
    modalName,
    initialValues,
    isEditMode,
    fetchPromociones,
    promocionAEditar,
    idSucursal,
    onClose
}) => {
    const URL = import.meta.env.VITE_API_URL;

    const promocionService = new PromocionService();
    const empresaService = new EmpresaService();
    const sucursalService = new SucursalService();
    const imagenService = new ImagenService();
    const promocionDetalleService = new PromocionDetalleService();


    const [sucursales, setSucursales] = useState<ISucursal[]>([]);
    const [selectedSucursales, setSelectedSucursales] = useState<number[]>([]);
    const [tipoPromocion, setTipoPromocion] = useState(TipoPromocion.PROMOCION);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [promocionImages, setPromocionImages] = useState<any[]>([]);
    const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
    const [dataArticles, setDataArticles] = useState<any[]>([]);



    const validationSchema = Yup.object().shape({
        denominacion: Yup.string().required('Campo requerido'),
        fechaDesde: Yup.date().required('Campo requerido'),
        fechaHasta: Yup.date().required('Campo requerido'),
        horaDesde: Yup.string().required('Campo requerido'),
        horaHasta: Yup.string().required('Campo requerido'),
        descripcionDescuento: Yup.string().required('Campo requerido'),
        precioPromocional: Yup.number().required('Campo requerido'),
    });


    const showModal = (title: string, text: string, icon: SweetAlertIcon) => {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            customClass: {
                container: "my-swal",
            },
        });
    };




    const handleNewArticle = async (idArticulo: number | null, cantidad: number) => {
        // Verifica si se han seleccionado un artículo y una cantidad válida
        if (idArticulo !== null && cantidad > 0) {
            try {
                // Construye el nuevo detalle del artículo
                const newArticleDetail = {
                    cantidad: cantidad,
                    idArticulo: idArticulo,
                };
                console.log(newArticleDetail);
                const updatedDetalles = [...dataArticles, newArticleDetail];
                setDataArticles(updatedDetalles);

                // Puedes agregar más lógica aquí para restablecer otros valores relacionados con el artículo si es necesario

            } catch (error) {
                console.error('Error al crear el detalle del artículo:', error);
                // Muestra un mensaje de error al usuario si ocurre algún error
                showModal("Error", "Ha ocurrido un error al crear el detalle del artículo", "error");
            }
        } else {
            // Muestra un mensaje de advertencia si no se seleccionó un artículo o la cantidad es cero
            showModal("Advertencia", "Debes seleccionar un artículo y especificar una cantidad válida", "warning");
        }
    };




    const columns: Column[] = [
        {
            id: "articulo",
            label: "",
            renderCell: (element) => (
                <Typography variant="body1">
                    {element.idArticulo}
                </Typography>
            )
        },
        {
            id: "cantidad",
            label: "Cantidad",
            renderCell: (element) => (
                <Typography variant="body1">
                    {element.cantidad}
                </Typography>
            )
        }
    ];

    useEffect(() => {
        const fetchArticulosPromocion = async () => {
            if (isEditMode && promocionAEditar) {
                try {
                    // Obtener los detalles de los artículos de la promoción
                    const detallesPromocion = await promocionDetalleService.get(`${URL}/promocion/getDetallesByid`, promocionAEditar.id);
                    const detallesArray = Array.isArray(detallesPromocion) ? detallesPromocion : [detallesPromocion];
                    setDataArticles(detallesArray);
                } catch (error) {
                    console.error('Error al cargar los detalles de los artículos:', error);
                }
            } else {
                // Limpiar los datos de detalle cuando se está añadiendo
                setDataArticles([]);
            }
        };
        fetchArticulosPromocion();
    }, [isEditMode, promocionAEditar]);





    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            // Verificar si la cantidad total de imágenes (las actuales más las nuevas) supera el límite de 3
            if (promocionImages.length + files.length > 3) {
                showModal("Error", "No puedes subir más de 3 imágenes", "warning");
                event.target.value = '';
                return;
            }

            // Si no supera el límite, actualizar la lista de archivos seleccionados
            setSelectedFiles(files);
            // Calcular la cantidad total de imágenes después de agregar las nuevas
            const totalImages = promocionImages.length + files.length;
            // Habilitar el botón de submit si hay al menos una imagen seleccionada
            setDisableSubmit(totalImages === 0);
        }
    };


    const uploadImages = async (id: number) => {
        if (!selectedFiles) {
            return showModal("No hay imágenes seleccionadas", "Selecciona al menos una imagen", "warning");;
        }
        const formData = new FormData();
        Array.from(selectedFiles).forEach((file) => {
            formData.append("uploads", file);
        });

        const url = `${URL}/promocion/uploads?id=${id}`;

        Swal.fire({
            title: "Subiendo imágenes...",
            text: "Espere mientras se suben los archivos.",
            customClass: {
                container: 'my-swal',
            },
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
                const modal = Swal.getPopup();
                if (modal) {
                    modal.classList.add('my-swal');
                }
            },
        });

        try {
            const response = await imagenService.uploadImages(url, formData);

            if (!response.ok) {
                throw new Error('Error al subir las imágenes');
            }

            showModal("Éxito", "Imágenes subidas correctamente", "success");
        } catch (error) {
            showModal("Error", "Algo falló al subir las imágenes, inténtalo de nuevo.", "error");
            console.error("Error al subir las imágenes:", error);
        }
        setSelectedFiles(null);
    };

    const handleDeleteImg = async (url: string, uuid: string) => {
        const urlParts = url.split("/");
        const publicId = urlParts[urlParts.length - 1];

        const formData = new FormData();
        formData.append("publicId", publicId);
        formData.append("id", uuid);

        if (promocionImages.length === 1) {
            showModal("Error", "No puedes eliminar la última imagen de la promocion", "warning");
            return;
        }

        Swal.fire({
            title: "Eliminando imagen...",
            text: "Espere mientras se elimina la imagen.",
            customClass: {
                container: 'my-swal',
            },
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await fetch(`${URL}/promocion/deleteImg`, {
                method: "POST",
                body: formData,
            });

            Swal.close();

            if (response.ok) {
                showModal("Éxito", "Imagen eliminada correctamente", "success");
                // Filtra la imagen eliminada de la lista
                const updatedImages = promocionImages.filter((img) => img.uuid !== uuid);
                setPromocionImages(updatedImages);
                // Vuelve a cargar las imágenes actualizadas
                fetchPromociones();
                onClose(); // Close the modal
            } else {
                showModal("Error", "Algo falló al eliminar la imagen, inténtalo de nuevo.", "error");
            }
        } catch (error) {
            Swal.close();
            showModal("Error", "Algo falló, contacta al desarrollador.", "error");
            console.error("Error:", error);
        }
    };


    const fetchSucursales = async () => {
        try {
            const sucursal = await sucursalService.get(`${URL}/sucursal`, idSucursal) as ISucursal;
            const empresaid = sucursal.empresa.id;
            const empresa = await empresaService.get(`${URL}/empresa/sucursales`, empresaid);
            const sucursales = empresa.sucursales;
            setSucursales(sucursales);
        } catch (error) {
            console.error("Error al obtener las sucursales:", error);
        }
    };

    useEffect(() => {
        fetchSucursales();
    }, [idSucursal]);

    const handleTipoPromocionChange = (event: SelectChangeEvent<TipoPromocion>) => {
        const tipo = event.target.value as TipoPromocion;
        // Actualiza el estado tipoPromocion
        setTipoPromocion(tipo);
    };


    const handleSubmit = async (values: PromocionPost) => {
        let rollback = false; // Variable para controlar el rollback
        let id: number | null = null;
        try {
            // Validaciones previas al envío de datos
            if (!isEditMode && (!selectedFiles || selectedFiles.length === 0)) {
                showModal("Error", "Debes subir al menos una imagen", "warning");
                return;
            }


            if (!isEditMode && selectedSucursales.length === 0) {
                showModal("Error", "Debe seleccionar al menos una sucursal.", "warning");
                return;
            }

            // Construcción del objeto a enviar
            const promocionPost: PromocionPost = {
                denominacion: values.denominacion,
                fechaDesde: values.fechaDesde,
                fechaHasta: values.fechaHasta,
                horaDesde: values.horaDesde,
                horaHasta: values.horaHasta,
                descripcionDescuento: values.descripcionDescuento,
                precioPromocional: values.precioPromocional,
                tipoPromocion: values.tipoPromocion,
                idSucursales: isEditMode ? promocionAEditar.sucursales.map((sucursal: ISucursal) => sucursal.id) : selectedSucursales,

                detalles: dataArticles.map((detalle) => {
                    return {
                        cantidad: detalle.cantidad,
                        idArticulo: isEditMode ?
                            (detalle.insumo !== null ? detalle.insumo.id :
                                (detalle.manufacturado !== null ? detalle.manufacturado.id : null))
                            : detalle.idArticulo,
                    };
                }),
            };

            console.log(promocionPost)


            let response;

            // Envío de datos (POST o PUT)
            if (isEditMode && promocionAEditar) {
                console.log(promocionAEditar.id)
                response = await promocionService.put(`${URL}/promocion`, promocionAEditar.id, promocionPost);
                id = promocionAEditar.id;
            } else {
                response = await promocionService.post(`${URL}/promocion`, promocionPost) as IPromocion;
                id = response.id;
            }

            // Verificación de éxito en el envío de datos
            if (id !== null) {
                if (selectedFiles && selectedFiles.length > 0) {
                    await uploadImages(id);
                }
                showModal("Éxito", isEditMode ? "Promoción editada correctamente" : "Promoción creada correctamente", "success");
                fetchPromociones();
            } else {
                throw new Error("El ID de la promoción es nulo");
            }
        } catch (error) {
            rollback = true; // Establecer rollback a true en caso de error
            if (id !== null && rollback) { // Realizar rollback si es necesario
                await promocionService.delete(`${URL}/promocion`, id);
            }
            showModal("Error", "Ocurrió un error, por favor intenta nuevamente.", "error");
            console.error('Error al enviar los datos:', error);
        }
    };




    const handleToggleSucursal = (sucursalId: number) => {
        if (selectedSucursales.includes(sucursalId)) {
            setSelectedSucursales(selectedSucursales.filter(id => id !== sucursalId));
        } else {
            setSelectedSucursales([...selectedSucursales, sucursalId]);
        }
    };


    return (
        <GenericModal
            modalName={modalName}
            title={isEditMode ? 'Editar Promocion' : 'Añadir Promocion'}
            initialValues={promocionAEditar || initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            isEditMode={isEditMode}
            disableSubmit={disableSubmit}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <TextFieldValue label="Denominación" name="denominacion" type="text" placeholder="Denominación" disabled={isEditMode} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextFieldValue name="fechaDesde" type="date" placeholder="Fecha Desde" label='Fecha de inicio' />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextFieldValue name="fechaHasta" type="date" placeholder="Fecha Hasta" label='Fecha de Fin' />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextFieldValue name="horaDesde" type="time" placeholder="Hora Desde" label='Hora de inicio' />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextFieldValue name="horaHasta" type="time" placeholder="Hora Hasta" label='Hora de Fin' />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextFieldValue label="Descripción del Descuento" name="descripcionDescuento" type="text" placeholder="Descripcion Descuento" disabled={isEditMode} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextFieldValue label="Precio Promocional" name="precioPromocional" type="number" placeholder="Precio Promocional" />


                    </Grid>
                </Grid>
                <FormControl fullWidth>
                    <InputLabel id="select-tipo-promocion-label">Tipo de Promoción</InputLabel>
                    <Select
                        labelId="select-tipo-promocion-label"
                        id="select-tipo-promocion"
                        value={tipoPromocion}
                        onChange={handleTipoPromocionChange}
                        label="Tipo de Promoción"
                        name="tipoPromocion"
                        disabled={isEditMode}
                    >
                        {Object.values(TipoPromocion).map((tipo) => (
                            <MenuItem key={tipo} value={tipo}>
                                {tipo}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<PhotoCamera />}
                        sx={{
                            my: 2,
                            bgcolor: "#fb6376",
                            "&:hover": {
                                bgcolor: "#d73754",
                            },
                        }}
                    >
                        Subir Imágenes
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                            multiple
                        />
                    </Button>
                    {isEditMode && promocionAEditar && promocionAEditar?.imagenes.length > 0 && (
                        <div>
                            <Typography variant='h5' sx={{ mb: 1 }}>Imágenes del producto</Typography>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {promocionAEditar?.imagenes.map((image: IImagen) => (
                                    <Card key={image.id} style={{ position: 'relative', width: '100px', height: '100px' }}>
                                        <CardMedia
                                            component="img"
                                            image={image.url}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <CardActions style={{ position: 'absolute', top: 0, right: 0 }}>
                                            <IconButton style={{ color: 'red' }} onClick={() => handleDeleteImg(image.url, image.id.toString())}>
                                                <Delete />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </Box>

                {!isEditMode && (
                    <>
                        <p>Selecciona las sucursales:</p>
                        {sucursales.map((sucursal: ISucursal) => (
                            <FormControlLabel
                                key={sucursal.id}
                                control={
                                    <Checkbox
                                        checked={selectedSucursales.includes(sucursal.id)}
                                        onChange={() => handleToggleSucursal(sucursal.id)}
                                    />
                                }
                                label={sucursal.nombre}
                            />
                        ))}
                    </>
                )}


            </div>
            {!isEditMode && (<>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2vh', marginTop: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <ArticuloSeleccionado onAgregarArticulo={handleNewArticle} />
                        </Grid>
                    </Grid>
                </Box>

                <TableComponent
                    data={dataArticles}
                    columns={columns}
                />
            </>)}

        </GenericModal>
    );
}

export default ModalPromocion;