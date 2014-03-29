/*
Copyright (c) 2011, Adobe Systems Incorporated
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are
met:

* Redistributions of source code must retain the above copyright notice, 
this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the 
documentation and/or other materials provided with the distribution.

* Neither the name of Adobe Systems Incorporated nor the names of its 
contributors may be used to endorse or promote products derived from 
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR 
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

package com.adobe.utils
{
	// ===========================================================================
	//	Imports
	// ---------------------------------------------------------------------------
	import flash.display3D.*;
	import flash.geom.Matrix3D;
	
	// ===========================================================================
	//	Class
	// ---------------------------------------------------------------------------
	public class FractalGeometryGenerator
	{
		// ======================================================================
		//	Properties
		// ----------------------------------------------------------------------
		protected var m_context3D:Context3D;
		protected var m_levels:int;
		protected var m_nObjs:int;
		
		protected var m_matrix:Matrix3D;
		protected var m_red:Number;
		protected var m_green:Number;
		protected var m_blue:Number;
		protected var m_alpha:Number;
		
		protected var m_program:Program3D;
		protected var m_indexBufferSize:uint;
		protected var m_vertexBufferSize:uint;
		
		protected var m_indexBuffer:IndexBuffer3D;
		protected var m_vertexBuffer:VertexBuffer3D;
		protected var m_indexData:Vector.<uint>;
		protected var m_vertexData:Vector.<Number>;	
		
		public function setColor( r:Number, g:Number, b:Number, a:Number ):void {
			m_red = r;
			m_green = g;
			m_blue = b;
			m_alpha = a;
		}
		
		public function setMatrix( matrix:Matrix3D ):void {
			m_matrix = matrix;
		}
		
		public function draw():void {
			m_context3D.setProgram( m_program );
			m_context3D.setVertexBufferAt( 0, m_vertexBuffer, 0, Context3DVertexBufferFormat.FLOAT_2 );
			m_context3D.setProgramConstantsFromMatrix( Context3DProgramType.VERTEX, 0, m_matrix, true );
			m_context3D.setProgramConstantsFromVector( Context3DProgramType.FRAGMENT, 0, Vector.<Number>( [ m_red, m_green, m_blue, m_alpha ] ));
			m_context3D.drawTriangles( m_indexBuffer, 0, m_indexBufferSize / 3 );		// 1 tri per 3 indices
		}
		
		public function FractalGeometryGenerator( context3D:Context3D, levels:uint )
		{
			m_context3D = context3D;
			m_levels = levels;
			m_matrix = new Matrix3D();
			m_red = m_green = m_blue = m_alpha = 1;
			
			initProgram();
			genGeom();
		}
		
		protected function initProgram():void {

			var vertexShaderAssembler:AGALMiniAssembler;
			var fragmentShaderAssembler:AGALMiniAssembler;
			
			vertexShaderAssembler = new AGALMiniAssembler();
			vertexShaderAssembler.assemble( Context3DProgramType.VERTEX, 
				"dp4 op.x, va0, vc0		\n" +	// 4x4 matrix transform from stream 0 to output clipspace
				"dp4 op.y, va0, vc1		\n" +
				"dp4 op.z, va0, vc2		\n" +
				"dp4 op.w, va0, vc3		\n"			
			);
			trace( "fractal geometry vertex program bytes:", vertexShaderAssembler.agalcode.length );
			
			fragmentShaderAssembler = new AGALMiniAssembler();
			fragmentShaderAssembler.assemble( Context3DProgramType.FRAGMENT, 
				"mov oc, fc0				\n"
			);
			trace( "fractal geomtery fragment program bytes:", fragmentShaderAssembler.agalcode.length );
			
			m_program = m_context3D.createProgram();
			m_program.upload( vertexShaderAssembler.agalcode, fragmentShaderAssembler.agalcode );			
		}		
		
		protected function genGeom():void {
			const nobjsPerLevel:int = 4;
			m_nObjs = 0;
			
			var i:int;
			var objsOnLevel:int = 1;
			
			for ( i = 0; i < m_levels; i++ ) {
				m_nObjs += objsOnLevel;
				objsOnLevel *= nobjsPerLevel;
			}
			
			m_indexBufferSize = 3 * 4 * m_nObjs;	// 3 indices * 4 tris * nobjs
			m_vertexBufferSize = 8 * m_nObjs;		// 4 vertices * nobjs
			
			m_indexBuffer = m_context3D.createIndexBuffer( m_indexBufferSize );
			m_vertexBuffer = m_context3D.createVertexBuffer( m_vertexBufferSize, 2 );	// x, y
			
			m_indexData = new Vector.<uint>( m_indexBufferSize );
			m_vertexData = new Vector.<Number>( m_vertexBufferSize * 2 );
			
			genLevel( 0, 0, 0, 0, 0 );
			
			m_indexBuffer.uploadFromVector( m_indexData, 0, 12 * m_nObjs );
			m_vertexBuffer.uploadFromVector( m_vertexData, 0, 8 * m_nObjs );
		}
		
		protected function genLevel( level:int, ox:Number, oy:Number, indexindex:uint, vertexindex:uint ):Object {
			var ii : uint = indexindex;
			var vi : uint = vertexindex;
			var s:Number = 1.0 / ( 1 << level );
			var d:Number = 1.0 / 16.0;
			
			/*
			diagonal rectangles
			m_vertexData[ vi * 2 + 0 ] = ox;
			m_vertexData[ vi * 2 + 1 ] = oy + s * d;
			m_vertexData[ vi * 2 + 2 ] = ox + s * ( 2.0 - d );
			m_vertexData[ vi * 2 + 3 ] = oy + s * 2.0;
			m_vertexData[ vi * 2 + 4 ] = ox + s * 2.0;
			m_vertexData[ vi * 2 + 5 ] = oy + s * ( 2.0 - d );
			m_vertexData[ vi * 2 + 6 ] = ox + s * d;
			m_vertexData[ vi * 2 + 7 ] = oy;
			*/
			
			/* vertical and horizontal cross 
			m_vertexData[ vi * 2 + 0 ] = ox - s * d;
			m_vertexData[ vi * 2 + 1 ] = oy - s;
			m_vertexData[ vi * 2 + 2 ] = ox - s * d;
			m_vertexData[ vi * 2 + 3 ] = oy + s;
			m_vertexData[ vi * 2 + 4 ] = ox + s * d;
			m_vertexData[ vi * 2 + 5 ] = oy + s;
			m_vertexData[ vi * 2 + 6 ] = ox + s * d;
			m_vertexData[ vi * 2 + 7 ] = oy - s;
			
			m_vertexData[ vi * 2 + 8  ] = ox - s;
			m_vertexData[ vi * 2 + 9  ] = oy - s * d;
			m_vertexData[ vi * 2 + 10 ] = ox - s;
			m_vertexData[ vi * 2 + 11 ] = oy + s * d;
			m_vertexData[ vi * 2 + 12 ] = ox + s;
			m_vertexData[ vi * 2 + 13 ] = oy + s * d;
			m_vertexData[ vi * 2 + 14 ] = ox + s;
			m_vertexData[ vi * 2 + 15 ] = oy - s * d;
			*/
			
			/* vertical and horizontal chevrons */ 
			m_vertexData[ vi * 2 + 0 ] = ox - s * d;
			m_vertexData[ vi * 2 + 1 ] = oy - s;
			m_vertexData[ vi * 2 + 2 ] = ox - s * d;
			m_vertexData[ vi * 2 + 3 ] = oy + s * d;
			m_vertexData[ vi * 2 + 4 ] = ox + s * d;
			m_vertexData[ vi * 2 + 5 ] = oy + s * d;
			m_vertexData[ vi * 2 + 6 ] = ox + s * d;
			m_vertexData[ vi * 2 + 7 ] = oy - s;
			
			m_vertexData[ vi * 2 + 8  ] = ox - s;
			m_vertexData[ vi * 2 + 9  ] = oy - s * d;
			m_vertexData[ vi * 2 + 10 ] = ox - s;
			m_vertexData[ vi * 2 + 11 ] = oy + s * d;
			m_vertexData[ vi * 2 + 12 ] = ox + s * d;
			m_vertexData[ vi * 2 + 13 ] = oy + s * d;
			m_vertexData[ vi * 2 + 14 ] = ox + s * d;
			m_vertexData[ vi * 2 + 15 ] = oy - s * d;
			
			//			m_vertexData[ 0 ] = -1;
			//			m_vertexData[ 1 ] = -1;
			//			m_vertexData[ 2 ] = -1;
			//			m_vertexData[ 3 ] = 1;
			//			m_vertexData[ 4 ] = 1;
			//			m_vertexData[ 5 ] = 1;
			//			m_vertexData[ 6 ] = 1;
			//			m_vertexData[ 7 ] = -1;			
			
			m_indexData[ indexindex + 0 ] = vi + 0;
			m_indexData[ indexindex + 1 ] = vi + 1;
			m_indexData[ indexindex + 2 ] = vi + 2;
			m_indexData[ indexindex + 3 ] = vi + 0;
			m_indexData[ indexindex + 4 ] = vi + 2;
			m_indexData[ indexindex + 5 ] = vi + 3;
			
			m_indexData[ indexindex + 6  ] = vi + 4;
			m_indexData[ indexindex + 7  ] = vi + 5;
			m_indexData[ indexindex + 8  ] = vi + 6;
			m_indexData[ indexindex + 9  ] = vi + 4;
			m_indexData[ indexindex + 10 ] = vi + 6;
			m_indexData[ indexindex + 11 ] = vi + 7;
			
			ii += 12;
			vi += 8;	// 16 floats (x, y) to make 8 vertices
			
			if ( level + 1 < m_levels ) {
				
				var obj : Object;
				
				obj = genLevel( level + 1, ox - s / 2, oy + s / 2, ii, vi );
				ii = obj.ii;
				vi = obj.vi;
				
				obj = genLevel( level + 1, ox + s / 2, oy + s / 2, ii, vi );
				ii = obj.ii;
				vi = obj.vi;
				
				obj = genLevel( level + 1, ox - s / 2, oy - s / 2, ii, vi );
				ii = obj.ii;
				vi = obj.vi;
				
				obj = genLevel( level + 1, ox + s / 2, oy - s / 2, ii, vi );
				ii = obj.ii;
				vi = obj.vi;
			}
			
			return { ii:ii, vi:vi };
		}
	}
}