ID	                Prueba	                             Resultado esperado
CP-01	Consultar inventario mediante Gemma	        Devuelve información real de PostgreSQL
CP-02	Consultar inventario bajo	                Identifica artículos bajo el mínimo
CP-03	Solicitar sugerencias de reposición	        Calcula las cantidades faltantes
CP-04	Registrar entrada de inventario	            Aumenta existencias y registra movimiento
CP-05	Registrar salida válida	                    Disminuye existencias correctamente
CP-06	Registrar salida superior al stock	        Rechaza operación sin alterar existencias
CP-07	Registrar artículo nuevo	                Crea artículo e inventario inicial
CP-08	Asignar artículo a otra sucursal	        Registra existencias independientes
CP-09	Duplicar asignación	                        Rechaza la asignación repetida
CP-10	Actualizar stock mínimo	                    Cambia el mínimo sin alterar la cantidad
CP-11	Enviar consulta vacía a la IA	            Devuelve HTTP 400
CP-12	Enviar consulta superior a 500 caracteres	Devuelve HTTP 400
CP-13	Ollama no disponible	                    Devuelve HTTP 503 controlado
CP-14	Consultar historial de IA	                Recupera interacciones guardadas
