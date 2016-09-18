 /***************************************************************************************
 *
 * Title:       Parametric Cryptex
 * File:        parametric_cryptex.jscad
 * Version:     v0.2
 * Date:        2016-09-17
 * Author:      Karl Kangur <karl.kangur@gmail.com>
 * Updated:		jneilliii
 * Licence:     CC-BY
 * Website:     https://github.com/jneilliii/Parametric-Cryptex
 *
 ***************************************************************************************/


function getParameterDefinitions()
{
  // Parameters accessible for the user
  return [
    {
      name: 'inner_diameter',
      caption: 'Inner diameter (mm):',
      type: 'float',
      initial: 20
    },
    {
      name: 'inner_height',
      caption: 'Inner height (mm):',
      type: 'float',
      initial: 60
    },
    {
      name: 'number_of_locks',
      caption: 'Number of locks:',
      type: 'float',
      initial: 4
    },
    {
      name: 'number_of_sides',
      caption: 'Number of sides on lock',
      type: 'float',
      initial: 10
    },
    {
      name: 'code_text',
      caption: 'Code text:',
      type: 'text',
      initial: "0123456789"
    },
    {
      name: 'circle_resolution',
      caption: 'Roundness',
      type: 'choice',
      values: [16, 32, 64],
      captions: ["Coarse", "Normal", "Fine"],
      initial: 16
    },
    {
      name: 'lock_spacing',
      caption: 'Lock spacing (mm):',
      type: 'float',
      initial: 0.3
    },
    {
      name: 'lid_margin',
      caption: 'Lid margin (mm):',
      type: 'float',
      initial: 0.9
    },
    {
      name: 'lock_margin',
      caption: 'Lock margin (mm):',
      type: 'float',
      initial: 0.4
    },
    {
      name: 'code_margin',
      caption: 'Code margin (mm):',
      type: 'float',
      initial: 0.25
    },
    {
      name: 'groove_angle',
      caption: 'Groove angle:',
      type: 'float',
      initial: 45
    },
    {
      name: 'groove_error',
      caption: 'Groove error (%):',
      type: 'float',
      initial: 5
    },
    {
      name: 'groove_margin',
      caption: 'Groove margin (mm):',
      type: 'float',
      initial: 0.5
    },
    {
      name: 'end_overlap',
      caption: 'End overlap (mm):',
      type: 'float',
      initial: 2.5
    },
    {
      name: 'code_extra',
      caption: 'Code extra thickness (mm):',
      type: 'float',
      initial: 1
    },
    {
      name: 'generate_part',
      caption: 'Generate',
      type: 'choice',
      values: [0, 1, 2, 3, 4],
      captions: ["Full model", "Base", "Lid", "Code ring", "Lock ring"],
      initial: 0
    }
  ];
}

function main(params)
{
  // User parameters
  var inner_diameter = params.inner_diameter;
  var inner_radius = inner_diameter / 2;
  var inner_height = params.inner_height;
  var number_of_locks = params.number_of_locks;
  var number_of_sides = params.number_of_sides;
  var code_text = params.code_text;
  var circle_resolution = params.circle_resolution;
  var lock_spacing = params.lock_spacing;
  var lid_margin = params.lid_margin;
  var lock_margin = params.lock_margin;
  var code_margin = params.code_margin;
  var groove_angle = params.groove_angle;
  var groove_error = params.groove_error;
  var groove_margin = params.groove_margin;
  var end_overlap = params.end_overlap;
  var code_extra = params.code_extra;

  var parts = {
    FULL: 0,
    BASE: 1,
    LID: 2,
    CODE_RING: 3,
    LOCK_RING: 4
  };
  var generate_part = params.generate_part;

  // General parameters
  var wall_width = 2; // Inner wall widths
  var sides_height = 6; // Lid and base height, top and bottom parts respectivly, the ones you pull on...
  var sides_hole_depth = 4; // Groove inside the lid and base, must be smaller than the height of the sides
  var sides_chamfer = 1; // Lid and base height, top and bottom parts respectivly, the ones you pull on...

  // Pin paramaters
  var pin_depth = 2; // Starting from the base cylinder outer radius
  var pin_width = 3;
  var pin_angle = 360 / 16 * 4; // So it looks nice
  var pin_offset = 2; // Top and bottom offset on a pin, margin for the lock
  var pin_groove_angle = groove_angle; // Angle of the groove where the pins go
  var pin_groove_offset = groove_error / 100 * 360 / number_of_sides; // To allow to insert the lid inside the base even if the codes are not perfectly aligned

  // Lock parameters
  var lock_minimum_width = 1; // Width at the thinnest point on the lock ring
  var lock_width = (inner_radius + wall_width + lid_margin + wall_width + pin_depth + lid_margin) * (1 / Math.cos(360 / number_of_sides / 2 * Math.PI / 180) - 1) + (lid_margin + pin_depth - lock_margin) + lock_minimum_width;
  var code_width = 2.5;

  // ################################################## BASE

  // Build the base
  var base_bottom_radius = inner_radius + wall_width + lid_margin + wall_width + lock_margin + lock_width + code_margin + code_width + end_overlap + code_extra;
  var base_bottom = cylinder({r: base_bottom_radius, h: sides_height, center: [true, true, false], fn: number_of_sides});

  // Make a chamfer on the bottom
  var base_bottom_chamfer = polygon({
    points: [
    [base_bottom_radius - sides_chamfer, 0],
    [base_bottom_radius, sides_chamfer],
    [base_bottom_radius, 0]
    ]});
  base_bottom_chamfer = rotate_extrude({fn: number_of_sides}, base_bottom_chamfer);

  base_bottom = difference(base_bottom, base_bottom_chamfer);

  var base_cylinder_radius = inner_radius + wall_width + lid_margin + wall_width;
  var base_cylinder_height = inner_height - sides_hole_depth - sides_hole_depth - lock_spacing;
  var base_cylinder = cylinder({r: base_cylinder_radius, h: base_cylinder_height, fn: circle_resolution});

  var base = union(
    base_bottom,
    translate([0, 0, sides_height], base_cylinder)
    );

  // Build the base inner space
  var base_cylinder_inside_radius = inner_radius + wall_width + lid_margin;
  var base_cylinder_inside = cylinder({r: base_cylinder_inside_radius, h: inner_height, fn: circle_resolution});

  // Build the pin grooves on the sides
  var base_groove = translate([base_cylinder_radius, 0, 0], cube({size: [2 * pin_depth + 2 * lid_margin, pin_width + 2 * lid_margin, inner_height], center: [true,true,false]}));
  var base_grooves = union(
    base_groove,
    rotate([0, 0, pin_angle], base_groove)
    );

  base_grooves = intersection(
    base_grooves,
    cylinder({r: inner_radius + wall_width + lid_margin + wall_width + pin_depth + lid_margin, h: inner_height, fn: circle_resolution})
    );

  // Add pins on the base so the lock can slide over it
  var pin_height = (inner_height - 2 * sides_hole_depth - lock_spacing) / number_of_locks;
  var pin_constant = pin_offset + lid_margin - lock_margin;

  var pin_tooth = polygon({
    points: [
    [inner_radius, pin_height - pin_constant],
    [inner_radius + wall_width + lid_margin + wall_width, pin_height - pin_constant],
    [inner_radius + wall_width + lid_margin + wall_width + pin_depth, pin_height - pin_constant - pin_depth],
    [inner_radius + wall_width + lid_margin + wall_width + pin_depth, pin_constant + pin_depth + lock_spacing],
    [inner_radius + wall_width + lid_margin + wall_width, pin_constant + lock_spacing],
    [inner_radius, pin_constant + lock_spacing]
    ]});
  pin_tooth = rotate_extrude({fn: circle_resolution}, pin_tooth);

  var pins = [];
  for(var i = 0; i < number_of_locks; i++)
  {
    pins.push(translate([0, 0, sides_height + i * pin_height], pin_tooth));
  }
  pins = union(pins);

  base = union(
    base,
    pins
    );

  var base_cut_angle = pin_groove_angle - pin_groove_offset;
  var base_cut_radius = base_bottom_radius / Math.cos(base_cut_angle * Math.PI / 180);
  var base_cut_chamfer = 1;
  var base_cut_chamfer_radius = inner_radius + wall_width + lid_margin + wall_width + pin_depth;
  var base_cut_chamfer_angle = Math.atan(base_cut_chamfer / base_cut_chamfer_radius);

  var base_cut = polygon({
    points: [
    [0, 0],
    [(base_cut_chamfer_radius - base_cut_chamfer) * Math.cos(base_cut_angle * Math.PI / 180), (base_cut_chamfer_radius - base_cut_chamfer) * Math.sin(base_cut_angle * Math.PI / 180)],
    [base_cut_chamfer_radius * Math.cos(base_cut_chamfer_angle + base_cut_angle * Math.PI / 180), base_cut_chamfer_radius * Math.sin(base_cut_chamfer_angle + base_cut_angle * Math.PI / 180)],
    [base_cut_radius * Math.cos(base_cut_angle * Math.PI / 180), base_cut_radius * Math.sin(base_cut_angle * Math.PI / 180)],
    [base_cut_radius * Math.cos(base_cut_angle * Math.PI / 180), -base_cut_radius * Math.sin(base_cut_angle * Math.PI / 180)],
    [base_cut_chamfer_radius * Math.cos(base_cut_chamfer_angle + base_cut_angle * Math.PI / 180), -base_cut_chamfer_radius * Math.sin(base_cut_chamfer_angle + base_cut_angle * Math.PI / 180)],
    [(base_cut_chamfer_radius - base_cut_chamfer) * Math.cos(base_cut_angle * Math.PI / 180), -(base_cut_chamfer_radius - base_cut_chamfer) * Math.sin(base_cut_angle * Math.PI / 180)]
    ]});
  base_cut = linear_extrude({height: inner_height}, base_cut);

  // Add chamfer for the lid
  var base_chamfer = union(
    translate([0, 0, base_cylinder_height - base_cut_chamfer], rotate([45, 0, pin_groove_angle - pin_groove_offset], cube({size: [base_cylinder_radius, 2 * base_cut_chamfer, 2 * base_cut_chamfer]}))),
    translate([0, 0, base_cylinder_height - base_cut_chamfer], rotate([45, 0, -pin_groove_angle + pin_groove_offset], cube({size: [base_cylinder_radius, 2 * base_cut_chamfer, 2 * base_cut_chamfer]})))
    );

  base_cut = union(
    base_cut,
    base_chamfer
    );

  base = difference(
    base,
    rotate([0, 0, 360 / number_of_sides / 2], translate([0, 0, sides_height], base_cut))
    );

  // Add up the negative space
  var base_inside = union(
    translate([0, 0, sides_height - sides_hole_depth], base_cylinder_inside)/*,
    translate([0, 0, sides_height], base_grooves)*/
    );

  // Add the arrow inset that inducates the row where the code should be entered
  var base_arrow_height = sides_height - sides_chamfer;
  var base_arrow = cylinder({r: base_arrow_height / 2, h: 1, center: [true, true, false], fn: 3});
  var base_arrow_radius = base_bottom_radius * Math.cos(360 / number_of_sides / 2 * Math.PI / 180);
  var base_arrow_angle = 360 / number_of_sides / 2;
  
  // Remove the negative space arrow the base, center the triangle on the side
  base = difference(
    base,
    rotate([0, 0, base_arrow_angle], translate([base_arrow_radius, 0, 3 * base_arrow_height / 8 + sides_chamfer], rotate([0, 270, 0], base_arrow)))
    );

  // Remove the negative space from the base
  base = difference(
    base,
    base_inside
    );

  // ################################################## LID

  var lid_top_radius = inner_radius + wall_width + lid_margin + wall_width + lock_margin + lock_width + code_margin + code_width + end_overlap + code_extra;
  var lid_top = cylinder({r: lid_top_radius, h: sides_height, center: [true, true, false], fn: number_of_sides});

    // Make a chamfer on the top
  var lid_top_chamfer = polygon({
    points: [
    [lid_top_radius - sides_chamfer, 0],
    [lid_top_radius, sides_chamfer],
    [lid_top_radius, 0]
    ]});
  lid_top_chamfer = rotate_extrude({fn: number_of_sides}, lid_top_chamfer);

  lid_top = difference(base_bottom, lid_top_chamfer);

  var lid_cylinder_radius = inner_radius + wall_width;
  var lid_cylinder_height = inner_height - lock_spacing;
  var lid_cylinder = cylinder({r: lid_cylinder_radius, h: lid_cylinder_height, fn: circle_resolution});

  var lid = union(
    lid_top,
    translate([0, 0, sides_height - sides_hole_depth], lid_cylinder)
    );

  // Cylinder to fill the spaces between the pins
  var pins_cylinder = cylinder({r: inner_radius + wall_width + lid_margin + wall_width, h: inner_height - sides_hole_depth - pin_constant - lock_spacing, fn: circle_resolution});
  pins = union(
    pins,
    translate([0, 0, sides_height - sides_hole_depth], pins_cylinder)
    );

  var lid_cut_angle = (pin_groove_angle - pin_groove_offset) * Math.PI / 180;
  var lid_cut_radius_inner = inner_radius + wall_width + lid_margin + wall_width + pin_depth;
  var lid_cut_radius_outer = lid_cut_radius_inner / Math.cos(lid_cut_angle);
  var lid_cut_offset = groove_margin / Math.sin(lid_cut_angle);
  var lid_cut_chamfer = 1;
  var lid_cut_offset_angle = Math.atan(groove_margin / (lid_cut_radius_inner - lid_cut_chamfer));
  var lid_cut_chamfer_angle = Math.atan(lid_cut_chamfer / (lid_cut_radius_inner - lid_cut_chamfer));

  var pins_cut = polygon({
    points: [
    [0, 0],
    [lid_cut_radius_outer * Math.cos(lid_cut_angle), lid_cut_radius_outer * Math.sin(lid_cut_angle)],
    [lid_cut_radius_outer * Math.cos(lid_cut_angle), -lid_cut_radius_outer * Math.sin(lid_cut_angle)]
    ]});
  pins_cut = linear_extrude({height: inner_height}, pins_cut);

  // Really complicated way to chamfer here because the cut has to be offset so that the walls between the base and lid are parallel
  var pins_chamfer = polygon({
    points: [
    [0, 0],
    [(lid_cut_radius_inner - lid_cut_chamfer) * Math.cos(-lid_cut_offset_angle + lid_cut_angle), (lid_cut_radius_inner - lid_cut_chamfer) * Math.sin(-lid_cut_offset_angle + lid_cut_angle)],
    [lid_cut_radius_inner * Math.cos(-lid_cut_offset_angle - lid_cut_chamfer_angle + lid_cut_angle), lid_cut_radius_inner * Math.sin(-lid_cut_offset_angle - lid_cut_chamfer_angle + lid_cut_angle)],
    [lid_cut_radius_outer * Math.cos(lid_cut_angle), lid_cut_radius_inner * Math.sin(lid_cut_angle)],
    [lid_cut_radius_outer * Math.cos(lid_cut_angle), -lid_cut_radius_inner * Math.sin(lid_cut_angle)],
    [lid_cut_radius_inner * Math.cos(-lid_cut_offset_angle - lid_cut_chamfer_angle + lid_cut_angle), -lid_cut_radius_inner * Math.sin(-lid_cut_offset_angle - lid_cut_chamfer_angle + lid_cut_angle)],
    [(lid_cut_radius_inner - lid_cut_chamfer) * Math.cos(-lid_cut_offset_angle + lid_cut_angle), -(lid_cut_radius_inner - lid_cut_chamfer) * Math.sin(-lid_cut_offset_angle + lid_cut_angle)]
    ]});
  pins_chamfer = linear_extrude({height: inner_height}, pins_chamfer);

  pins_cut = intersection(
    translate([lid_cut_offset, 0, 0], pins_cut),
    pins_chamfer
    );

  // Add chamfer for the base
  var lid_chamfer_position = sides_height - sides_hole_depth + inner_height - sides_hole_depth - pin_constant - lock_spacing - lid_cut_chamfer;
  var lid_chamfer = union(
    translate([lid_cut_offset, 0, lid_chamfer_position], rotate([45, 0, pin_groove_angle - pin_groove_offset], cube({size: [lid_cut_radius_outer, 2 * lid_cut_chamfer, 2 * lid_cut_chamfer]}))),
    translate([lid_cut_offset, 0, lid_chamfer_position], rotate([45, 0, -pin_groove_angle + pin_groove_offset], cube({size: [lid_cut_radius_outer, 2 * lid_cut_chamfer, 2 * lid_cut_chamfer]})))
    );

  pins_cut = difference(
    pins_cut,
    lid_chamfer
    );

  pins = intersection(
    pins,
    rotate([0, 0, -360 / number_of_sides / 2], pins_cut)
    );

  // Assemble the lid and the pins
  lid = union(
    lid,
    pins
    );

  // Build the lid inner space
  var top_inside = cylinder({r: inner_radius, h: inner_height, fn: circle_resolution});

  // Remove the negative space from the top
  lid = difference(
    lid,
    translate([0, 0, sides_height - sides_hole_depth], top_inside)
    );

  // Add the arrow inset that inducates the row where the code should be entered
  var lid_arrow_height = sides_height - sides_chamfer;
  var lid_arrow = cylinder({r: lid_arrow_height / 2, h: 1, center: [true, true, false], fn: 3});
  var lid_arrow_radius = lid_top_radius * Math.cos(360 / number_of_sides / 2 * Math.PI / 180);
  var lid_arrow_angle = -360 / number_of_sides * 1/2;
  
  // Remove the negative space arrow the base, center the triangle on the side
  lid = difference(
    lid,
    rotate([0, 0, lid_arrow_angle], translate([lid_arrow_radius, 0, 3 * lid_arrow_height / 8 + sides_chamfer], rotate([0, 270, 0], lid_arrow)))
    );

  // ################################################## LOCK

  var lock_ring_inner_radius = inner_radius + wall_width + lid_margin + wall_width + lock_margin;
  var lock_ring_outer_radius = lock_ring_inner_radius + lock_width;
  var lock_ring_height = (inner_height - 2 * sides_hole_depth - lock_spacing) / number_of_locks;
  var lock_ring_depth = pin_depth - lock_margin + lid_margin;
  
  // The +1 is there to make sure the subseqent substaction of the outer part overlaps with the inner part
  var lock_ring_inner = polygon({
    points: [
    [lock_ring_inner_radius, lock_ring_height],
    [lock_ring_outer_radius + 1, lock_ring_height],
    [lock_ring_outer_radius + 1, lock_spacing],
    [lock_ring_inner_radius, lock_spacing],
    [lock_ring_inner_radius, pin_offset + lock_spacing],
    [lock_ring_inner_radius + lock_ring_depth, lock_ring_depth + pin_offset + lock_spacing],
    [lock_ring_inner_radius + lock_ring_depth, lock_ring_height - lock_ring_depth - pin_offset],
    [lock_ring_inner_radius, lock_ring_height - pin_offset]
    ]});
  lock_ring_inner = rotate_extrude({fn: circle_resolution}, lock_ring_inner);

  // Groove cut
  var lock_ring_cut_radius = lock_ring_outer_radius / Math.cos(pin_groove_angle * Math.PI / 180);
  var lock_ring_cut_chamfer = 1;
  var lock_ring_cut_chamfer_angle = Math.atan((lock_ring_cut_chamfer + 1) / lock_ring_inner_radius);

  var lock_ring_cut = polygon({
    points: [
    [0, 0],
    [(lock_ring_inner_radius - 1) * Math.cos(lock_ring_cut_chamfer_angle + pin_groove_angle * Math.PI / 180), (lock_ring_inner_radius - 1) * Math.sin(lock_ring_cut_chamfer_angle + pin_groove_angle * Math.PI / 180)],
    [(lock_ring_inner_radius + lock_ring_cut_chamfer) * Math.cos(pin_groove_angle * Math.PI / 180), (lock_ring_inner_radius + lock_ring_cut_chamfer) * Math.sin(pin_groove_angle * Math.PI / 180)],
    [lock_ring_cut_radius * Math.cos(pin_groove_angle * Math.PI / 180), lock_ring_cut_radius * Math.sin(pin_groove_angle * Math.PI / 180)],
    [lock_ring_cut_radius * Math.cos(pin_groove_angle * Math.PI / 180), -lock_ring_cut_radius * Math.sin(pin_groove_angle * Math.PI / 180)],
    [(lock_ring_inner_radius + lock_ring_cut_chamfer) * Math.cos(pin_groove_angle * Math.PI / 180), -(lock_ring_inner_radius + lock_ring_cut_chamfer) * Math.sin(pin_groove_angle * Math.PI / 180)],
    [(lock_ring_inner_radius - 1) * Math.cos(lock_ring_cut_chamfer_angle + pin_groove_angle * Math.PI / 180), -(lock_ring_inner_radius - 1) * Math.sin(lock_ring_cut_chamfer_angle + pin_groove_angle * Math.PI / 180)]
   
    ]});
  lock_ring_cut = linear_extrude({height: lock_ring_height + lock_spacing}, lock_ring_cut);

  lock_ring_inner = difference(
    lock_ring_inner,
    rotate([0, 0, 360 / number_of_sides / 2], lock_ring_cut)
    );

  // Remove the outer code ring from the inner lock ring
  var lock_ring_mask_radius = inner_radius + wall_width + lid_margin + wall_width + lock_margin + lock_width;
  var lock_ring_chamfer = 1;

  var lock_ring_outer = polygon({
    points: [
    [inner_radius, lock_ring_height],
    [lock_ring_mask_radius - lock_ring_chamfer, lock_ring_height],
    [lock_ring_mask_radius, lock_ring_height - lock_ring_chamfer],
    [lock_ring_mask_radius, lock_spacing + lock_ring_chamfer],
    [lock_ring_mask_radius - lock_ring_chamfer, lock_spacing],
    [inner_radius, lock_spacing]
    ]});
  lock_ring_outer = rotate_extrude({fn: number_of_sides}, lock_ring_outer);

  var lock_ring = intersection(lock_ring_inner, lock_ring_outer);

  // ################################################## CODE

  var code_ring_inner_radius = inner_radius + wall_width + lid_margin + wall_width + lock_margin + lock_width + code_margin;
  var code_ring_outer_radius = inner_radius + wall_width + lid_margin + wall_width + lock_margin + lock_width + code_margin + code_width + code_extra;
  var code_ring_height = (inner_height - 2 * sides_hole_depth - lock_spacing) / number_of_locks;

  var code_ring_chamfer = 1;
  var code_ring = polygon({
    points: [
    [code_ring_inner_radius, code_ring_height - code_ring_chamfer],
    [code_ring_inner_radius + code_ring_chamfer, code_ring_height],
    [code_ring_outer_radius, code_ring_height],
    [code_ring_outer_radius, lock_spacing],
    [code_ring_inner_radius + code_ring_chamfer, lock_spacing],
    [code_ring_inner_radius, code_ring_chamfer + lock_spacing]
    ]});
  code_ring = rotate_extrude({fn: number_of_sides}, code_ring);

  // Write the code on the code ring
  var code_text_depth = 1;
  var code_text_scale = 0.5;
  var code_text_spacing = 360 / number_of_sides * Math.PI / 180;
  var code_text_radius = code_ring_outer_radius * Math.cos(code_text_spacing / 2) - code_text_depth;

  var o = [];
  for(var i = 0; i < Math.min(code_text.length, number_of_sides); i++)
  {
    var l = vector_char(0, 0, code_text[i]);
    l.segments.forEach(function(s)
    {
      var code = rectangular_extrude(s, {w: 3, h: code_text_depth});
      var code_scaled = scale([code_text_scale, code_text_scale, 1], code);
      // Center the code
      code = translate([-l.width * code_text_scale / 2 - code_ring_height / 2, (-23 / 2 + 1) * code_text_scale, 0], code_scaled);

      //code = rotate([0, 0, code_text_angle], code);

      o.push(rotate([0, 90, 360 / number_of_sides * (i + 1/2)], translate([0, 0, code_text_radius], code)));
    });
  }

  code_ring = difference(code_ring, union(o));

  // ################################################## PARTS

  // Generation of separate parts or full model
  if(generate_part == parts.BASE)
  {
    return base;
  }
  else if(generate_part == parts.LID)
  {
    return lid;
  }
  else if(generate_part == parts.CODE_RING)
  {
    return translate([0, 0, -lock_spacing], code_ring);
  }
  else if(generate_part == parts.LOCK_RING)
  {
    return translate([0, 0, -lock_spacing], lock_ring);
  }
  else
  {
    var lstLocks = [base,translate([0, 0, inner_height + sides_hole_depth], rotate([180, 0, 0], lid))];
    for(var i = 0; i < number_of_locks; i++) {
        lstLocks.push(translate([0, 0, sides_height + i * lock_ring_height], lock_ring));
		lstLocks.push(translate([0, 0, sides_height + i * code_ring_height], code_ring));
	};
    return union(lstLocks);
  }
}
