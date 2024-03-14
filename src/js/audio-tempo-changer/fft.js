'use strict';

/*
 * Performs an in-place complex FFT.
 * Adapted from FFT for ActionScript 3 written by Gerald T. Beauregard 
 * (original ActionScript3 version, http://gerrybeauregard.wordpress.com/2010/08/03/an-even-faster-as3-fft/)
 *
 * Copyright (c) 2015-2019 Margus Niitsoo
 */

import {VH} from './vector_helper.js';

export function FFT(logN) {

	// Size of the buffer
	var m_N = 1 << logN;


	var obj = {
		m_logN : logN, m_N : m_N,
		m_invN : 1.0 / m_N,
		m_re : VH.float_array(m_N),
		m_im : VH.float_array(m_N),
		m_revTgt : new Array(m_N)
	}

	// Calculate bit reversals
	for(var k = 0; k<m_N; k++) {
		var x = k, y = 0;
		for(var i=0;i<logN;i++) {
			y <<= 1;
			y |= x & 1;
			x >>= 1;
		}
		obj.m_revTgt[k] = y;
	}

    // Compute a multiplier factor for the "twiddle factors".
    // The twiddle factors are complex unit vectors spaced at
    // regular angular intervals. The angle by which the twiddle
    // factor advances depends on the FFT stage. In many FFT
    // implementations the twiddle factors are cached.

	obj.twiddleRe = VH.float_array(obj.m_logN);
	obj.twiddleIm = VH.float_array(obj.m_logN);

	var wIndexStep = 1;
	for(var stage = 0; stage<obj.m_logN; stage++) {
		var wAngleInc = 2.0 * wIndexStep * Math.PI * obj.m_invN;
		obj.twiddleRe[stage] = Math.cos(wAngleInc);
		obj.twiddleIm[stage] = Math.sin(wAngleInc);
		wIndexStep <<= 1;
	}

	// In-place FFT function
	obj.inplace = function(inverse) {

		var m_re = obj.m_re, m_im = obj.m_im;
		var m_N = obj.m_N, m_logN = obj.m_logN;

		var numFlies = m_N >> 1;
		var span = m_N >> 1;
		var spacing = m_N;

		if(inverse) {
			var m_invN = 1.0/m_N;
			for(var i=0; i<m_N; i++) {
				m_re[i] *= m_invN;
				m_im[i] *= m_invN;
			}
		}

		// For each stage of the FFT
		for(var stage=0; stage<m_logN; stage++) {
			var wMulRe = obj.twiddleRe[stage];
			var wMulIm = obj.twiddleIm[stage];
			if(!inverse) wMulIm *= -1;

			var start = 0;
			while(start < m_N) {
				var iTop = start, iBot = start + span;
				var wRe = 1.0, wIm = 0.0;

				// For each butterfly in this stage
				for(var flyCount=0; flyCount<numFlies; flyCount++) {
					// Get the top & bottom values
					var xTopRe = m_re[iTop];
					var xTopIm = m_im[iTop];
					var xBotRe = m_re[iBot];
					var xBotIm = m_im[iBot];

					// Top branch of butterfly has addition
					m_re[iTop] = xTopRe + xBotRe;
					m_im[iTop] = xTopIm + xBotIm;

					// Bottom branch of butterly has subtraction,
                    // followed by multiplication by twiddle factor
					xBotRe = xTopRe - xBotRe;
					xBotIm = xTopIm - xBotIm;

					m_re[iBot] = xBotRe * wRe - xBotIm * wIm;
					m_im[iBot] = xBotRe * wIm + xBotIm * wRe;

					// Advance butterfly to next top & bottom positions
                    iTop++;
                    iBot++;

                    // Update the twiddle factor, via complex multiply
                    // by unit vector with the appropriate angle
                    // (wRe + j wIm) = (wRe + j wIm) x (wMulRe + j wMulIm)
					var tRe = wRe;
					wRe = wRe * wMulRe - wIm * wMulIm;
					wIm = tRe * wMulIm + wIm * wMulRe;
				}
				start += spacing;
			}
			numFlies >>= 1;
			span >>= 1;
			spacing >>= 1;
		}

		var revI, buf, m_revTgt = obj.m_revTgt;
		for(var i1=0; i1<m_N; i1++)
			if(m_revTgt[i1] > i1) {
                // Bit-Reversal is an involution i.e.
                // x.revTgt.revTgt==x
                // So switching values around
                // restores the original order
				revI = m_revTgt[i1];
				buf = m_re[revI];
				m_re[revI] = m_re[i1];
				m_re[i1] = buf;
				buf = m_im[revI];
				m_im[revI] = m_im[i1];
				m_im[i1] = buf;
			}
	}

	var m_N2 = m_N >> 1; // m_N/2 needed in un/repack below

	// Two-for-one trick for real-valued FFT:
	// Put one series in re, other in im, run "inplace",
	// then call this "unpack" function
	obj.unpack = function(rre,rim,ire,iim) {
		rre[0] = obj.m_re[0]; ire[0] = obj.m_im[0];
		rim[0] = iim[0] = 0;
		rre[m_N2] = obj.m_re[m_N2];
		ire[m_N2] = obj.m_im[m_N2];
		rim[m_N2] = iim[m_N2] = 0;
		for(var i = 1;i<m_N2;i++) {
			rre[i] = (obj.m_re[i] + obj.m_re[m_N - i]) / 2;
			rim[i] = (obj.m_im[i] - obj.m_im[m_N - i]) / 2;
			ire[i] = (obj.m_im[i] + obj.m_im[m_N - i]) / 2;
			iim[i] = (-obj.m_re[i] + obj.m_re[m_N - i]) / 2;
		}
	}
	
	// The two-for-one trick if you know results are real-valued
	// Call "repack", then fft.inplace(true) and you have
	// First fft in re and second in im
	obj.repack = function(rre,rim,ire,iim) {
		obj.m_re[0] = rre[0]; obj.m_im[0] = ire[0];
		obj.m_re[m_N2] = rre[m_N2]; obj.m_im[m_N2] = ire[m_N2];
		for(var i = 1;i<m_N2;i++) {
			obj.m_re[i] = rre[i] - iim[i];
			obj.m_im[i] = rim[i] + ire[i];
			obj.m_re[m_N - i] = rre[i] + iim[i];
			obj.m_im[m_N - i] = -rim[i] + ire[i];
		}
	}

	return obj;
}
