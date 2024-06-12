import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import BaseNavbar from '../components/ui/common/Navbar/BaseNavbar';
import Inicio from '../components/screens/Inicio/Inicio';
import SidebarLayout from '../components/ui/common/SideBarLayout/SideBarLayout';
import SucursalComponent from '../components/screens/Sucursal/SucursalComponent';
import Insumo from '../components/screens/Insumo/Insumo';
import Producto from '../components/screens/Producto/Producto';
import Categoria from '../components/screens/Categoria/Categoria';
import UnidadMedida from '../components/screens/UnidadMedida/UnidadMedida';
import Promocion from '../components/screens/Promocion/Promocion';
import EmpresaComponent from '../components/screens/Empresa/EmpresaComponent';

const Rutas: React.FC = () => {
  return (
    <>
        <div className='navbar'>
          <BaseNavbar />
        </div>
      <Routes>
            <Route path="/" element={<Navigate to="/empresa" />} />
            <Route path="/empresa" element={<EmpresaComponent /> } />
            <Route path="/empresa/:empresaId" element={<SucursalComponent />} />
            <Route path="/" element={<SidebarLayout />}>
              <Route path="/dashboard/:sucursalId" element={<Inicio />} />
              <Route path="/insumos/:sucursalId" element={<Insumo/>} />
              <Route path="/productos/:sucursalId" element={<Producto />} />
              <Route path="/unidadMedida/:sucursalId" element={<UnidadMedida />} />
              <Route path="/categorias/:sucursalId" element={<Categoria />} />
              <Route path="/promociones/:sucursalId" element={<Promocion/>} />
            </Route>
      </Routes>
    </>
  );
};

export default Rutas;
